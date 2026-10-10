#!/usr/bin/env bash
set -Eeuo pipefail

######################################
# Configuration
######################################
REMOTE_USER_HOST="debian@ks-b"

# Base dir of the bots stack on the server
API_ROOT="/var/www/bots"

# The bot runner (PFA-124) — one of the three parts of `bots/`, each deployed by its own script:
# this one, `nest-api/deploy-api.sh` and `front/deploy-front.sh`. Same shape as folio's,
# pfa's and Zeus's: a release folder, a switch with the previous release kept as a backup, a pm2
# reload, an automatic rollback when anything fails after the switch.

# Paths on the server
NEST_DIR="$API_ROOT/runner"
NEST_BACKUP_DIR="$API_ROOT/runner.bak"
NEST_RELEASES_DIR="$API_ROOT/runner-releases"
# The runner's state — bots' passwords (0600), kill switch, upload ledger, quiet hours — lives
# outside the release folders, so a deploy or a rollback never touches it (RUNNER_STATE_DIR).
STATE_DIR="$API_ROOT/state"
# How many releases stay under $NEST_RELEASES_DIR after a successful switch. The directory
# is history only — what is live is a copy of a release, not a link into it — so
# pruning it can never touch what is served. Nothing bounded it before TRE-149,
# where Trekker's had reached 86 entries. This one is emptied by its own switch
# and holds nothing between deploys; the bound is for the day that changes.
KEEP_RELEASES="${KEEP_RELEASES:-5}"

# Local project dir (= runner/, where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# The branch a deploy must match exactly — see `require_clean_tree`.
DEPLOY_BRANCH="${DEPLOY_BRANCH:-master}"

PM2_APP_NAME="bots-runner"

# Gitignored and kept on this machine — see `ecosystem.config.example.cjs`. On ks-b it sits beside
# the API's, under its own name: two ecosystem files in one folder, each reloaded by its own script.
ECOSYSTEM_FILE="ecosystem.config.cjs"
ECOSYSTEM_REMOTE_NAME="runner.ecosystem.config.cjs"

######################################
# Reporting to Zeus (COS-459)
######################################
# The runner's slug in Zeus's port registry, and which part of it this script deploys. Zeus refuses a
# report naming an app the registry has never heard of; an unregistered *role* it records with a
# warning instead, because that means the registry is behind the box and dropping it would hide
# exactly that.
# The stack is three apps in Zeus named after their pm2 processes (bots-nest-api, bots-front,
# bots-runner), so the fleet board can tell them apart. Its own block too (7300), since Zeus's
# convention puts an API on its block's first port.
ZEUS_APP_NAME="${ZEUS_APP_NAME:-bots-runner}"
# `api`: Zeus knows two roles, `api` and `front`, and refuses any other in a report.
ZEUS_ROLE="api"

# **Zeus's** own files on ks-b, as pfa's scripts read them: the back-office API sends Zeus no cron
# reports, so — unlike folio's — its ecosystem file holds no ingest token to read. Same order as
# Zeus's API resolves them — see `read_setting` in `zeus_report`.
#
# Read there rather than carried on the laptop, for two reasons. The secret never travels: it is
# read on the box, used on the box, and never appears in an ssh command line where `ps` would show
# it. And the endpoint is loopback-only — a report has to be sent from ks-b whatever happens,
# because this script runs on a laptop that Zeus's nginx would refuse.
ZEUS_ECOSYSTEM_FILE="${ZEUS_ECOSYSTEM_FILE:-/var/www/zeus/ecosystem.config.js}"
ZEUS_ENV_FILE="${ZEUS_ENV_FILE:-/var/www/zeus/nest-api/.env}"

# The served changelog and the marker holding the last deployed commit. Hoisted out of
# `write_deploy_log` because the report to Zeus measures its commit range from the same marker, and
# two independent resolutions of the same baseline is how they drift apart.
DEPLOY_LOG_DIR="$API_ROOT/deploy-logs"
# `runner`, not `$ZEUS_ROLE`: both write into /var/www/bots/deploy-logs beside the API's own files.
DEPLOY_LOG_FILE="$DEPLOY_LOG_DIR/deploys-runner.txt"
DEPLOY_MARKER="$DEPLOY_LOG_DIR/.last-runner"

######################################
# Utility functions
######################################

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Refuse to ship a tree that is not exactly what is on the remote branch (COS-436).
#
# Taken from Zeus's deploy scripts; spira's predate it. `rsync` copies the working tree as it is, so
# what deploys is whatever is on this laptop — not what is committed and not what is merged. On
# 2026-08-06 that shipped an uncommitted Prisma schema change to production against an unmigrated
# database, and a front build missing a fix that was already on `origin/main`. Both were invisible
# until production broke.
#
# Runs before any ssh, rsync or remote change: the whole point is to fail on the laptop, with
# nothing on the server touched.
require_clean_tree() {
  cd "$SCRIPT_DIR"

  local dirty
  dirty=$(git status --porcelain)
  if [ -n "$dirty" ]; then
    echo "❌ ERROR: refusing to deploy — the working tree is not clean:" >&2
    printf '%s\n' "$dirty" >&2
    echo "   commit, stash or clean these first." >&2
    exit 1
  fi

  # Without a fetch, `origin/$DEPLOY_BRANCH` is whatever this laptop last heard, which is exactly
  # the stale value that let a behind-by-one tree deploy. A failure here is fatal on purpose: a
  # deploy needs the network anyway, so "cannot reach the remote" is never the moment to guess.
  if ! git fetch --quiet origin "$DEPLOY_BRANCH"; then
    echo "❌ ERROR: refusing to deploy — could not fetch origin/$DEPLOY_BRANCH to compare against." >&2
    exit 1
  fi

  local head remote
  head=$(git rev-parse HEAD)
  remote=$(git rev-parse FETCH_HEAD)

  if [ "$head" != "$remote" ]; then
    echo "❌ ERROR: refusing to deploy — HEAD does not match origin/$DEPLOY_BRANCH:" >&2
    echo "   local  $head" >&2
    echo "   remote $remote" >&2
    echo "   pull, push or check out the right branch first." >&2
    exit 1
  fi
}

# The commit the previous deploy shipped — the base of this deploy's commit range.
#
# Order: the marker (steady state) → a `BOTS_SINCE` override → the newest release folder's hash →
# empty, which both consumers read as "no baseline, fall back to the last ten commits". Same order
# `write_deploy_log` used inline before, so the changelog is unchanged; the difference is that it now
# happens once and both consumers read the answer.
#
# Resolved **once, before anything writes**. `write_deploy_log` moves the marker at the end of a
# successful deploy, so a second resolution later in the run would return this deploy's own commit
# and both the changelog and the report to Zeus would come out claiming nothing shipped.
resolve_base_hash() {
  local base
  base=$(ssh "$REMOTE_USER_HOST" "cat '$DEPLOY_MARKER' 2>/dev/null || true" 2>/dev/null || true)
  [ -z "$base" ] && base="${BOTS_SINCE:-}"
  [ -z "$base" ] && base="${PREV_FROM_SERVER:-}"

  # A hash this checkout does not have is no baseline at all — a shallow clone, or a marker left by
  # a deploy from a branch since rewritten.
  if [ -n "$base" ] && ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
    base=""
  fi

  printf '%s' "$base"
}

# The commits this deploy ships, as a JSON array, newest first.
#
# `ZEUS_BASE_HASH` is the commit the last deploy shipped; with none — a first report — the last ten
# commits stand in for a range nobody can reconstruct, the same baseline the changelog uses.
#
# Every message is escaped in awk rather than interpolated into a shell string. `%s` is the subject
# line only, so it cannot contain a newline, and splitting on the first two spaces is exact because
# neither a sha nor an ISO-8601 date contains one.
zeus_commits_json() {
  local -a range

  # A manual rollback restores a release rather than shipping one. Falling through to the last-ten
  # baseline there would claim it delivered ten commits it had nothing to do with.
  if [ "${ZEUS_REPORT_COMMITS:-true}" != "true" ]; then
    printf '[]'
    return 0
  fi

  if [ -n "${ZEUS_BASE_HASH:-}" ]; then
    range=("${ZEUS_BASE_HASH}..HEAD")
  else
    range=(-n 10 HEAD)
  fi

  # Limited to this part's own folder, like the changelog: the repo is PFA's.
  git log --no-merges --pretty=format:'%H %aI %s' "${range[@]}" -- "$SCRIPT_DIR" 2>/dev/null | awk '
    BEGIN { printf "["; first = 1 }
    NF >= 3 {
      sha = $1
      when = $2
      msg = substr($0, length(sha) + length(when) + 3)
      gsub(/\\/, "\\\\", msg)
      gsub(/"/, "\\\"", msg)
      gsub(/\t/, " ", msg)
      if (!first) printf ","
      printf "{\"sha\":\"%s\",\"authoredAt\":\"%s\",\"message\":\"%s\"}", sha, when, msg
      first = 0
    }
    END { printf "]" }'
}

# Escape a value for a JSON string literal.
#
# `zeus_commits_json` escapes commit messages in awk because it reads them a line at a time. Every
# *other* string in the payload is interpolated by hand below, and Zeus's original does that raw —
# fine for the summaries this script actually passes, all of them quote-free literals, and one
# `zeus_report "failed" "could not read \"x\""` away from posting malformed JSON. Zeus would answer
# 400, and since every error on this path is swallowed the report would vanish with no symptom.
# Applied to every field rather than the ones that look risky, so nothing here needs re-deciding.
#
# Backslash first: the reverse order would escape the backslashes this step adds. Commit subjects
# and git ref names cannot contain a newline, so tab is the only control character left to handle.
json_escape() {
  local s="$1"
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  s=${s//$'\t'/ }
  printf '%s' "$s"
}

# Tell Zeus what this deploy did: `zeus_report <success|failed|rolled_back> [summary]`.
#
# Three rules, from `Zeus/docs/reporting/README.md`, and none of them is optional:
#   1. reporting must never fail the deploy — every step here is `|| true`, and the caller ignores
#      the return value too;
#   2. fire and forget, 2 second timeout, no retries;
#   3. the payload travels as a **file**, never interpolated into a shell command, because commit
#      messages contain quotes, backticks and `$`.
#
# The POST happens on ks-b over ssh rather than from here: the endpoint is loopback-only and nginx
# denies it from outside the box.
zeus_report() {
  local status="$1"
  local summary="${2:-}"
  local commits payload remote_payload duration

  commits=$(zeus_commits_json 2>/dev/null || echo "[]")
  duration=$(( ($(date +%s) - ${ZEUS_STARTED_EPOCH:-$(date +%s)}) * 1000 ))
  payload=$(mktemp)
  remote_payload="/tmp/.bots-runner-deploy-report.$$.json"

  {
    printf '{"app":"%s","role":"%s","status":"%s"' \
      "$(json_escape "$ZEUS_APP_NAME")" "$(json_escape "$ZEUS_ROLE")" "$(json_escape "$status")"
    printf ',"startedAt":"%s","durationMs":%s' "$(json_escape "${ZEUS_STARTED_AT}")" "$duration"
    [ -n "${ZEUS_RELEASE:-}" ] && printf ',"release":"%s"' "$(json_escape "$ZEUS_RELEASE")"
    [ -n "${ZEUS_COMMIT:-}" ] && printf ',"commit":"%s"' "$(json_escape "$ZEUS_COMMIT")"
    [ -n "${ZEUS_BRANCH:-}" ] && printf ',"branch":"%s"' "$(json_escape "$ZEUS_BRANCH")"
    [ -n "$summary" ] && printf ',"summary":"%s"' "$(json_escape "$summary")"
    printf ',"commits":%s}' "$commits"
  } > "$payload"

  scp -q "$payload" "$REMOTE_USER_HOST:$remote_payload" || { rm -f "$payload"; return 0; }
  rm -f "$payload"

  ssh "$REMOTE_USER_HOST" \
    ZEUS_ECOSYSTEM_FILE="$ZEUS_ECOSYSTEM_FILE" \
    ZEUS_ENV_FILE="$ZEUS_ENV_FILE" \
    PAYLOAD="$remote_payload" \
    'bash -s' << 'EOF' || true
set -uo pipefail

cleanup() { rm -f "$PAYLOAD"; }
trap cleanup EXIT

# One setting, looked for in the pm2 ecosystem file first and the `.env` second.
#
# **That order is not a preference, it is the order the API itself resolves them.** pm2 injects
# `env_production` into the process environment before Nest starts, and dotenv does not overwrite a
# variable that is already there — so a value in the ecosystem file wins, and the `.env` is only
# consulted when the ecosystem file is silent. Reading the `.env` alone would present a token the
# API is not validating against the day the two files disagree, which is a `401` on every deploy
# report and no other symptom.
#
# Neither value is ever defaulted here. A fallback URL would put Zeus's port in this repo's source,
# which is the one place a port reassignment cannot rewrite — and since every error below is
# swallowed, a stale default would fail quietly and forever.
#
# `\042` and `\047` are the double and single quote, so a value written either way is unwrapped
# without this needing quotes of its own inside a heredoc.
read_setting() {
  local key="$1" value=""

  if [ -f "$ZEUS_ECOSYSTEM_FILE" ]; then
    value=$(sed -n "s/.*${key}: *['\"]\([^'\"]*\)['\"].*/\1/p" "$ZEUS_ECOSYSTEM_FILE" 2>/dev/null | tail -1)
  fi

  if [ -z "$value" ] && [ -f "$ZEUS_ENV_FILE" ]; then
    value=$(sed -n "s/^${key}=//p" "$ZEUS_ENV_FILE" 2>/dev/null | tail -1 | tr -d '\042\047')
  fi

  printf '%s' "$value"
}

url=$(read_setting ZEUS_DEPLOY_INGEST_URL)
token=$(read_setting ZEUS_INGEST_TOKEN)

if [ -z "$url" ] || [ -z "$token" ]; then
  echo "zeus: not reported — ZEUS_DEPLOY_INGEST_URL or ZEUS_INGEST_TOKEN found in neither" \
    "$ZEUS_ECOSYSTEM_FILE nor $ZEUS_ENV_FILE"
  exit 0
fi

code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
  -X POST "$url" \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $token" \
  --data-binary @"$PAYLOAD" || true)

# 202 is the contract. Anything else is worth one line in the deploy output and nothing more —
# a deploy that shipped and could not say so still shipped.
[ "$code" = "202" ] || echo "zeus: report not recorded (HTTP ${code:-none})"
EOF
}

# Remote rollback helper (used by manual and auto rollback)
remote_rollback() {
  ssh "$REMOTE_USER_HOST" \
    NEST_DIR="$NEST_DIR" \
    NEST_BACKUP_DIR="$NEST_BACKUP_DIR" \
    API_ROOT="$API_ROOT" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

cd "$API_ROOT"

if [ ! -d "$NEST_BACKUP_DIR" ]; then
  echo "❌ ERROR: Backup directory not found" >&2
  exit 1
fi

rm -rf "$NEST_DIR"
mv "$NEST_BACKUP_DIR" "$NEST_DIR"

echo "✅ Runner rollback done on server (restored from backup)"
EOF
}

# The pnpm version is deliberately not written down here. Each project pins it
# in package.json ("packageManager") and both machines switch to that version on
# their own. What this guards is the *baseline* pnpm — the binary that performs
# the switch. A server baseline older than this machine's may not honour the pin
# at all, in which case the build would quietly run on the wrong pnpm.
#
# npm_config_manage_package_manager_versions=false bypasses the pin: without it
# both sides would report the pinned version and the comparison would prove
# nothing. It has to be the environment variable — the equivalent
# `--config.manage-package-manager-versions=false` flag is silently ignored
# here, because the version switch happens before flags are parsed.
check_pnpm_baseline() {
  local local_v remote_v oldest

  local_v=$(npm_config_manage_package_manager_versions=false pnpm -v 2>/dev/null) || {
    echo "❌ ERROR: pnpm not found on this machine" >&2
    exit 1
  }

  remote_v=$(ssh "$REMOTE_USER_HOST" \
    'export PATH="$HOME/.local/share/pnpm:$PATH"; npm_config_manage_package_manager_versions=false pnpm -v' \
    2>/dev/null) || {
    echo "❌ ERROR: pnpm not found on the server" >&2
    exit 1
  }

  oldest=$(printf '%s\n%s\n' "$local_v" "$remote_v" | sort -V | head -1)
  if [ "$remote_v" != "$local_v" ] && [ "$oldest" = "$remote_v" ]; then
    echo "❌ ERROR: the server's pnpm ($remote_v) is older than this machine's ($local_v)." >&2
    echo "   Update pnpm on the server before deploying." >&2
    exit 1
  fi

  log "➡️  pnpm baseline — local $local_v / server $remote_v"
}

deploy() {
  require_clean_tree
  check_pnpm_baseline
  cd "$SCRIPT_DIR"

  ######################################
  # Git metadata for release naming
  ######################################

  local GIT_HASH
  GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")

  local GIT_BRANCH_RAW
  GIT_BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "no-branch")

  local GIT_BRANCH
  GIT_BRANCH=${GIT_BRANCH_RAW//\//-}
  GIT_BRANCH=${GIT_BRANCH// /_}

  local TIMESTAMP
  TIMESTAMP=$(date +'%Y%m%d-%H%M%S')

  local RELEASE_NAME="release-${TIMESTAMP}-${GIT_BRANCH}-${GIT_HASH}"
  local NEST_RELEASE_REMOTE="$NEST_RELEASES_DIR/$RELEASE_NAME"
  local SWITCH_DONE="false"

  # Current live runner commit, read from the newest release folder name (…-<hash>) before this
  # deploy's own folder is created. Seeds the commit range on the very first run, when no marker
  # exists yet. Non-fatal: an empty value falls back to the last-10 baseline.
  #
  # `write_deploy_log` has always read this variable and nothing ever set it, so the fallback was
  # dead; deploy-front.sh set it correctly all along. Fixed here because the report to Zeus depends
  # on the same baseline (COS-459).
  local PREV_FROM_SERVER
  PREV_FROM_SERVER=$(ssh "$REMOTE_USER_HOST" "ls -1 '$NEST_RELEASES_DIR' 2>/dev/null | sort | tail -1" 2>/dev/null \
    | sed -nE 's/.*-([0-9a-f]{7,40})$/\1/p' || true)

  # What the report to Zeus will carry (COS-459), gathered here so that a deploy which fails at its
  # very first step still reports something true. Not `local`: `zeus_report` is defined outside this
  # function, and the failure path calls it from the ERR trap.
  ZEUS_STARTED_AT=$(date -u +%FT%TZ)
  ZEUS_STARTED_EPOCH=$(date +%s)
  ZEUS_RELEASE="$RELEASE_NAME"
  ZEUS_BRANCH="$GIT_BRANCH_RAW"
  ZEUS_COMMIT=$(git rev-parse HEAD 2>/dev/null || true)
  ZEUS_BASE_HASH=$(resolve_base_hash)

  ######################################
  # Error handler (rollback if needed)
  ######################################
  on_error() {
    local lineno=$1
    log "❌ ERROR: runner deployment failed at line $lineno"

    if [[ "$SWITCH_DONE" == "true" ]]; then
      log "↩️  Auto rollback: switching the runner back to its previous version"
      if remote_rollback; then
        log "✅ Auto rollback succeeded"
        log "➡️  Reloading the runner with pm2 after rollback"
        restart_pm2
        # `rolled_back`, not `failed`, and the distinction is the whole reason Zeus has three
        # statuses: the deploy did fail, and the box is serving exactly what it served before.
        zeus_report "rolled_back" "deploy failed at line $lineno — previous release restored" || true
      else
        log "❌ Auto rollback failed, manual intervention required"
        zeus_report "failed" "deploy failed at line $lineno — rollback failed too" || true
      fi
    else
      log "ℹ️  No rollback needed: the live runner was not modified yet"
      zeus_report "failed" "deploy failed at line $lineno — production was not modified" || true
    fi
  }

  restart_pm2() {
    ssh "$REMOTE_USER_HOST" \
      API_ROOT="$API_ROOT" \
      'bash -s' << 'EOF'
set -Eeuo pipefail
cd "$API_ROOT"
pm2 startOrReload runner.ecosystem.config.cjs --env production --update-env
pm2 save
EOF
  }

  # Prepend this deploy's commits (+ ticket keys) to the served changelog — only the commits that
  # touched `bots/runner`: the repo is PFA's, and most of its history is not this part's.
  # Always invoked as `write_deploy_log || log ...`, so errexit is ignored throughout:
  # a changelog hiccup can never fail or roll back an otherwise successful deploy.
  write_deploy_log() {
    local LOG_DIR="$DEPLOY_LOG_DIR"
    local LOG_FILE="$DEPLOY_LOG_FILE"
    local MARKER="$DEPLOY_MARKER"
    local FULL_HASH WHEN PREV_HASH TICKETS COMMITS ENTRY_TMP
    local -a RANGE
    FULL_HASH=$(git rev-parse HEAD)
    WHEN=$(date +'%Y-%m-%d %H:%M:%S')

    # Already resolved for the whole run — see `resolve_base_hash`. Reading the marker again here
    # would be reading it after this function's own previous run moved it.
    PREV_HASH="${ZEUS_BASE_HASH:-}"
    if [ -n "$PREV_HASH" ]; then
      RANGE=("${PREV_HASH}..HEAD")
    else
      RANGE=(-n 10 HEAD)
    fi

    # One git-log call, captured into a var (pipefail-safe: no `| grep -q` on a pipe git may SIGPIPE).
    COMMITS=$(git log --no-merges --pretty=format:'  %h  %ad  %s' --date=short "${RANGE[@]}" -- "$SCRIPT_DIR")
    TICKETS=$(printf '%s\n' "$COMMITS" \
      | grep -oiE '(PFA|COS)-[0-9]+' | tr 'a-z' 'A-Z' | sort -u -t- -k1,1 -k2,2n | paste -sd ',' - | sed 's/,/, /g' || true)

    ENTRY_TMP=$(mktemp)
    {
      echo "=== $WHEN · branch $GIT_BRANCH_RAW · deploy $GIT_HASH ==="
      [ -n "$TICKETS" ] && echo "Tickets: $TICKETS"
      [ -z "$PREV_HASH" ] && echo "  (first recorded deploy — baseline: last 10 commits, not full history)"
      if [ -n "$COMMITS" ]; then
        printf '%s\n' "$COMMITS"
      else
        echo "  (no new commit — redeploy of $GIT_HASH)"
      fi
      echo
    } > "$ENTRY_TMP"

    # Commit messages travel as file content (scp), never interpolated into a shell command.
    ssh "$REMOTE_USER_HOST" "mkdir -p '$LOG_DIR'"
    scp -q "$ENTRY_TMP" "$REMOTE_USER_HOST:$LOG_DIR/.entry.tmp"
    ssh "$REMOTE_USER_HOST" \
      LOG_DIR="$LOG_DIR" \
      LOG_FILE="$LOG_FILE" \
      MARKER="$MARKER" \
      FULL_HASH="$FULL_HASH" \
      'bash -s' << 'EOF'
set -Eeuo pipefail
touch "$LOG_FILE"
cat "$LOG_DIR/.entry.tmp" "$LOG_FILE" > "$LOG_FILE.new"
mv "$LOG_FILE.new" "$LOG_FILE"
rm -f "$LOG_DIR/.entry.tmp"
printf '%s\n' "$FULL_HASH" > "$MARKER"
EOF
    rm -f "$ENTRY_TMP"
  }

  trap 'on_error $LINENO' ERR

  ######################################
  # Remote: prepare release directory
  ######################################
  log "➡️  Preparing release directory on server"

  ssh "$REMOTE_USER_HOST" \
    NEST_RELEASES_DIR="$NEST_RELEASES_DIR" \
    NEST_RELEASE_REMOTE="$NEST_RELEASE_REMOTE" \
    API_ROOT="$API_ROOT" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

mkdir -p "$API_ROOT"
mkdir -p "$NEST_RELEASES_DIR"

rm -rf "$NEST_RELEASE_REMOTE"
mkdir -p "$NEST_RELEASE_REMOTE"
EOF

  ######################################
  # Rsync the runner
  ######################################
  log "➡️  Syncing runner source to release directory (rsync)"

  # `.env` and `.env*.local` stay on this machine, the fix spira, pfa and Zeus got in SPI-116,
  # PFA-185 and ZEU-86. The carry-forward step below says the server's `.env` "only ever exists on
  # the server". Without these lines the laptop's own `.env` (local root database credentials) would
  # ride along and win over it.
  rsync -az \
    --delete \
    --exclude=".git" \
    --exclude=".env" \
    --exclude=".env*.local" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude=".DS_Store" \
    --exclude=".runner-state" \
    --exclude="*.tsbuildinfo" \
    --exclude="deploy-runner.sh" \
    --exclude="ecosystem.config.cjs" \
    "$SCRIPT_DIR/" \
    "$REMOTE_USER_HOST":"$NEST_RELEASE_REMOTE/"

  ######################################
  # Sync the ecosystem file, and make sure the state folder exists
  ######################################
  # Gitignored and kept on this machine, the way Zeus, PFA and folio all do it: it holds the control
  # token and PFA's synthetic-admin token as literals, so it must never reach git, and scp'ing it
  # here means the server copy is never hand-edited either. Start one from ecosystem.config.example.cjs.
  log "➡️  Syncing $ECOSYSTEM_REMOTE_NAME"

  scp "$SCRIPT_DIR/$ECOSYSTEM_FILE" "$REMOTE_USER_HOST:$API_ROOT/$ECOSYSTEM_REMOTE_NAME"
  ssh "$REMOTE_USER_HOST" "chmod 600 '$API_ROOT/$ECOSYSTEM_REMOTE_NAME' && mkdir -p '$STATE_DIR' && chmod 700 '$STATE_DIR'"

  ######################################
  # Carry forward the server .env
  ######################################
  # Not in git, not in the rsync source — it only ever exists on the server. Copy
  # it from the still-live directory into the new release before the swap below
  # replaces that directory, the same way deploy-front.sh already does.
  log "➡️  Carrying forward the server .env, if one exists"

  ssh "$REMOTE_USER_HOST" \
    NEST_DIR="$NEST_DIR" \
    NEST_RELEASE_REMOTE="$NEST_RELEASE_REMOTE" \
    'bash -s' << 'EOF'
set -Eeuo pipefail
if [ -f "$NEST_DIR/.env" ] && [ ! -f "$NEST_RELEASE_REMOTE/.env" ]; then
  cp "$NEST_DIR/.env" "$NEST_RELEASE_REMOTE/.env"
fi
EOF

  ######################################
  # Switch current ↔ backup (atomic)
  ######################################
  log "➡️  Performing atomic runner release switch with backup"

  ssh "$REMOTE_USER_HOST" \
    NEST_DIR="$NEST_DIR" \
    NEST_BACKUP_DIR="$NEST_BACKUP_DIR" \
    NEST_RELEASE_REMOTE="$NEST_RELEASE_REMOTE" \
    API_ROOT="$API_ROOT" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

cd "$API_ROOT"

if [ ! -d "$NEST_RELEASE_REMOTE" ]; then
  echo "❌ ERROR: Release directory does not exist" >&2
  exit 1
fi

if [ ! -f "$NEST_RELEASE_REMOTE/package.json" ]; then
  echo "❌ ERROR: Runner release is empty (no package.json in $NEST_RELEASE_REMOTE)" >&2
  exit 1
fi

rm -rf "$NEST_BACKUP_DIR"

if [ -d "$NEST_DIR" ]; then
  mv "$NEST_DIR" "$NEST_BACKUP_DIR"
fi

mv "$NEST_RELEASE_REMOTE" "$NEST_DIR"

echo "✅ New runner release activated"
EOF

  SWITCH_DONE="true"

  ######################################
  # Fresh install
  ######################################
  # No build: the runner runs its TypeScript through `tsx` (a dependency, not a dev one), and has
  # no database of its own. `--prod` keeps vitest and biome off the box.
  log "➡️  Installing dependencies on server"

  ssh "$REMOTE_USER_HOST" \
    NEST_DIR="$NEST_DIR" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

export PATH="$HOME/.local/share/pnpm:$PATH"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm is not installed on this server (required for the runner deploy)" >&2
  exit 1
fi

cd "$NEST_DIR"
rm -rf node_modules
pnpm install --frozen-lockfile --prod
EOF

  ######################################
  # Restart via pm2
  ######################################
  log "➡️  Reloading the runner with pm2"

  restart_pm2

  trap - ERR

  # After the switch and the health check, and non-fatal: a prune that failed
  # must not turn a deploy that worked into one that reports failure. Release
  # names carry their timestamp, so newest-first order is a reverse sort, and
  # what gets removed is everything after the first N of it.
  log "➡️  Pruning releases, keeping the last $KEEP_RELEASES"
  ssh "$REMOTE_USER_HOST" \
    RELEASES_DIR="$NEST_RELEASES_DIR" \
    KEEP="$KEEP_RELEASES" \
    'bash -s' << 'EOF' || log "⚠️  Release pruning skipped (non-fatal)"
set -Eeuo pipefail
cd "$RELEASES_DIR"
# `find` exits 0 on an empty directory; `ls release-*` exits 2 there, which under
# pipefail aborted this block before it said anything. Empty is the normal state
# wherever the switch moves the release into place instead of pointing at it.
removed=0
while read -r old; do
  if rm -rf -- "$old"; then echo "🗑  $old"; removed=$((removed + 1)); else echo "⚠️  could not remove $old" >&2; fi
done < <(find . -mindepth 1 -maxdepth 1 -name 'release-*' -printf '%f\n' | sort -r | tail -n +"$((KEEP + 1))")
echo "✅ $removed removed, $(find . -mindepth 1 -maxdepth 1 -name 'release-*' | wc -l) kept"
EOF

  write_deploy_log || log "⚠️  Deploy changelog update skipped (non-fatal)"
  zeus_report "success" || log "⚠️  Zeus was not told about this deploy (non-fatal)"

  log "✅ Runner deployment completed successfully"
  log "ℹ️  Runner control API on 127.0.0.1:7300 (loopback only). The kill switch is persisted: a"
  log "    deploy restarts the runner in the state it was left in — off on the very first start."
  log "ℹ️  Previous version is available in: $NEST_BACKUP_DIR"
  log "ℹ️  You can manually rollback with: ./deploy-runner.sh rollback"
}

rollback() {
  log "↩️  Manual rollback to previous runner version"

  # A manual rollback is reported for the same reason an automatic one is: it changes what is live,
  # and Zeus's whole claim is to know which build each service is serving. It ships no commits — see
  # `zeus_commits_json` — and names no release, because the release it restores is whatever was in
  # the backup directory and this script never learns its name.
  ZEUS_STARTED_AT=$(date -u +%FT%TZ)
  ZEUS_STARTED_EPOCH=$(date +%s)
  ZEUS_REPORT_COMMITS="false"

  if remote_rollback; then
    log "➡️  Reloading the runner with pm2 after rollback"
    ssh "$REMOTE_USER_HOST" \
      API_ROOT="$API_ROOT" \
      'bash -s' << 'EOF'
set -Eeuo pipefail
cd "$API_ROOT"
pm2 startOrReload runner.ecosystem.config.cjs --env production --update-env
pm2 save
EOF
    zeus_report "rolled_back" "manual rollback — the previous release is live again" || true
    log "✅ Manual runner rollback completed. Previous version is now live."
  else
    log "❌ Rollback failed. Check server state manually."
    zeus_report "failed" "manual rollback failed — the box needs looking at" || true
    exit 1
  fi
}

######################################
# Script entry point
######################################

ACTION="${1:-deploy}"

case "$ACTION" in
  deploy)
    deploy
    ;;
  rollback)
    rollback
    ;;
  *)
    echo "Usage: $0 [deploy|rollback]"
    exit 1
    ;;
esac
