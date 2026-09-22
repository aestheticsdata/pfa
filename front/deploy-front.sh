#!/usr/bin/env bash
set -Eeuo pipefail

######################################
# Configuration
######################################
REMOTE_USER_HOST="debian@ks-b"
WEB_ROOT_BASE="/var/www/pfa"
CURRENT_DIR="$WEB_ROOT_BASE/public_html"
BACKUP_DIR="$WEB_ROOT_BASE/public_html.bak"
RELEASES_DIR="$CURRENT_DIR/releases"
PM2_ECOSYSTEM_FILE="ecosystem.config.cjs"

######################################
# Reporting to Zeus
######################################
# pfa's slug in Zeus's port registry, and which half of it this script deploys. Zeus refuses a
# report naming an app its registry has never heard of; a `role` it has no service for is recorded
# with a warning rather than dropped, because that means the registry is behind ks-b and hiding
# the deploy would hide exactly that.
ZEUS_APP_NAME="${ZEUS_APP_NAME:-pfa}"
ZEUS_ROLE="front"

# **Zeus's** own files on ks-b, not pfa's: they carry the ingest URL and the shared token. Every
# other path in this script points into /var/www/pfa, and these two are the pair that must not.
#
# Read there rather than carried on the laptop, for two reasons. The secret never travels — it is
# read on ks-b, used on ks-b, and never appears in this repo, in a local `.env`, or on an ssh
# command line where `ps` would show it. And the endpoint is loopback-only, so the POST has to
# happen on ks-b whatever else is true: this script runs on a laptop, which nginx would refuse.
ZEUS_ECOSYSTEM_FILE="${ZEUS_ECOSYSTEM_FILE:-/var/www/zeus/ecosystem.config.js}"
ZEUS_ENV_FILE="${ZEUS_ENV_FILE:-/var/www/zeus/nest-api/.env}"

# The served changelog and the marker holding the last deployed commit. Hoisted out of
# `write_deploy_log` because the report to Zeus measures its commit range from the same marker.
# Both names are unchanged — `deploys-front.txt`, `.last-front` — so the marker already on
# ks-b keeps being read and the first report picks up where the changelog left off.
DEPLOY_LOG_DIR="$WEB_ROOT_BASE/deploy-logs"
DEPLOY_LOG_FILE="$DEPLOY_LOG_DIR/deploys-$ZEUS_ROLE.txt"
DEPLOY_MARKER="$DEPLOY_LOG_DIR/.last-$ZEUS_ROLE"

# Allow running the script from any location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

######################################
# Utility functions
######################################

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# The commit the previous deploy shipped — the base of this deploy's commit range.
#
# Order: the marker (steady state) → a `PFA_SINCE` override → the newest release folder's hash →
# empty, which both consumers read as "no baseline, fall back to the last ten commits".
#
# Resolved **once, before anything writes**. `write_deploy_log` moves the marker at the end of a
# successful deploy, so a second resolution later in the run would return this deploy's own commit,
# and both the changelog and the report to Zeus would come out claiming nothing shipped.
resolve_base_hash() {
  local base
  base=$(ssh "$REMOTE_USER_HOST" "cat '$DEPLOY_MARKER' 2>/dev/null || true" 2>/dev/null || true)
  [ -z "$base" ] && base="${PFA_SINCE:-}"
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
# Messages are escaped in awk rather than interpolated into a shell string. `%s` is the subject line
# only, so it cannot contain a newline, and splitting on the first two spaces is exact because
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

  git log --no-merges --pretty=format:'%H %aI %s' "${range[@]}" 2>/dev/null | awk '
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

# Every scalar that goes into the payload goes through this first. A branch name can hold a
# backslash and a summary can hold a quote, and either one interpolated raw is invalid JSON that
# Zeus answers with a 400 nobody reads.
json_escape() {
  local s="$1"
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  s=${s//$'\t'/ }
  printf '%s' "$s"
}

# Tell Zeus what this deploy did: `zeus_report <success|failed|rolled_back> [summary]`.
#
# Three rules, from Zeus's `docs/reporting/README.md`, and none of them is optional:
#   1. reporting must never fail the deploy — every step here is `|| true`, and the caller ignores
#      the return value too;
#   2. fire and forget, 2 second timeout, no retries;
#   3. the payload travels as a **file**, never interpolated into a shell command, because commit
#      messages contain quotes, backticks and `$`.
#
# The POST happens on ks-b over ssh rather than from here: the endpoint is loopback-only and nginx
# denies it from outside ks-b.
zeus_report() {
  local status="$1"
  local summary="${2:-}"
  local commits payload remote_payload duration

  commits=$(zeus_commits_json 2>/dev/null || echo "[]")
  duration=$(( ($(date +%s) - ${ZEUS_STARTED_EPOCH:-$(date +%s)}) * 1000 ))
  payload=$(mktemp)
  remote_payload="/tmp/.pfa-deploy-report.$$.json"

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
    'bash -s' << 'ZEUSEOF' || true
set -uo pipefail

cleanup() { rm -f "$PAYLOAD"; }
trap cleanup EXIT

# One setting, looked for in Zeus's pm2 ecosystem file first and its `.env` second.
#
# **That order is not a preference, it is the order Zeus's API resolves them.** pm2 injects
# `env_production` into the process environment before Nest starts, and dotenv does not overwrite a
# variable that is already there — so a value in the ecosystem file wins, and the `.env` is only
# consulted when the ecosystem file is silent. Reading the `.env` alone would present a token the
# API is not validating against the day the two files disagree: a `401` on every deploy report and
# no other symptom.
#
# Neither value is ever defaulted. A fallback URL would put Zeus's port in this repo's source,
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
ZEUSEOF
}

remote_pm2_reload() {
  ssh "$REMOTE_USER_HOST" \
    CURRENT_DIR="$CURRENT_DIR" \
    PM2_ECOSYSTEM_FILE="$PM2_ECOSYSTEM_FILE" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

export PATH="/home/debian/.npm-global/bin:/home/debian/.local/share/pnpm:/usr/local/bin:/usr/bin:/bin:/usr/sbin:$PATH"

cd "$CURRENT_DIR"

if [ ! -f "$PM2_ECOSYSTEM_FILE" ]; then
  echo "❌ ERROR: Missing PM2 ecosystem file: $CURRENT_DIR/$PM2_ECOSYSTEM_FILE" >&2
  exit 1
fi

pm2 startOrReload "$CURRENT_DIR/$PM2_ECOSYSTEM_FILE" --update-env
pm2 save
EOF
}

# Remote rollback helper (used by manual and auto rollback)
remote_rollback() {
  ssh "$REMOTE_USER_HOST" \
    CURRENT_DIR="$CURRENT_DIR" \
    BACKUP_DIR="$BACKUP_DIR" \
    WEB_ROOT_BASE="$WEB_ROOT_BASE" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

cd "$WEB_ROOT_BASE"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ ERROR: No backup directory found at $BACKUP_DIR" >&2
  exit 1
fi

mkdir -p "$CURRENT_DIR"
cd "$CURRENT_DIR"

TMP_RELEASES_DIR="$WEB_ROOT_BASE/.releases_tmp_rollback"

if [ -d "releases" ]; then
  rm -rf "$TMP_RELEASES_DIR"
  mv "releases" "$TMP_RELEASES_DIR"
fi

shopt -s dotglob
if compgen -G "*" > /dev/null; then
  rm -rf * 2>/dev/null || true
fi
shopt -u dotglob

if [ -d "$TMP_RELEASES_DIR" ]; then
  mv "$TMP_RELEASES_DIR" "$CURRENT_DIR/releases"
fi

if [ -d "$BACKUP_DIR" ]; then
  shopt -s dotglob
  if compgen -G "$BACKUP_DIR/*" > /dev/null; then
    mv "$BACKUP_DIR"/* "$CURRENT_DIR"/ 2>/dev/null || true
  fi
  shopt -u dotglob
fi

rm -rf "$BACKUP_DIR"
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
  check_pnpm_baseline
  cd "$SCRIPT_DIR"

  # `.env.production` is not committed, and its absence is silent in a way that matters: the
  # NEXT_PUBLIC_ values are inlined at build time, so a missing file does not fail the build — it
  # ships a bundle with sign-ups reopened and error reporting switched off, and says nothing.
  # Checked before anything is uploaded, so a fresh clone fails here rather than on the server.
  if [ ! -f "$SCRIPT_DIR/.env.production" ]; then
    echo "❌ ERROR: missing front/.env.production — copy .env.example and fill it in. It is not committed." >&2
    exit 1
  fi

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
  local STAGING_DIR="$RELEASES_DIR/$RELEASE_NAME"
  local SWITCH_DONE="false"

  # Current live front commit, read from the newest release folder name (…-<hash>) before this
  # deploy's own staging folder is created. Used only to seed the changelog on the very first run
  # (no marker yet). Non-fatal: an empty value just falls back to the last-10 baseline.
  local PREV_FROM_SERVER
  PREV_FROM_SERVER=$(ssh "$REMOTE_USER_HOST" "ls -1 '$RELEASES_DIR' 2>/dev/null | sort | tail -1" 2>/dev/null \
    | sed -nE 's/.*-([0-9a-f]{7,40})$/\1/p' || true)

  # What the report to Zeus will carry, gathered here so that a deploy which fails at its very
  # first step still reports something true. Not `local`: `zeus_report` is defined outside this
  # function, and the failure path calls it from the ERR trap.
  ZEUS_STARTED_AT=$(date -u +%FT%TZ)
  ZEUS_STARTED_EPOCH=$(date +%s)
  ZEUS_RELEASE="$RELEASE_NAME"
  ZEUS_BRANCH="$GIT_BRANCH_RAW"
  ZEUS_COMMIT=$(git rev-parse HEAD 2>/dev/null || true)
  ZEUS_BASE_HASH=$(resolve_base_hash)

  on_error() {
    local lineno=$1
    log "❌ ERROR: Deployment failed at line $lineno"

    if [[ "$SWITCH_DONE" == "true" ]]; then
      log "↩️  Auto rollback: switching back to previous version"
      if remote_rollback; then
        remote_pm2_reload || true
        log "✅ Auto rollback succeeded"
        # `rolled_back`, not `failed`, and the distinction is the whole reason Zeus has three
        # statuses: the deploy did fail, and ks-b is serving exactly what it served before.
        zeus_report "rolled_back" "deploy failed at line $lineno — previous release restored" || true
      else
        log "❌ Auto rollback failed, manual intervention required"
        zeus_report "failed" "deploy failed at line $lineno — rollback failed too" || true
      fi
    else
      log "ℹ️  No rollback needed: production was not modified yet"
      zeus_report "failed" "deploy failed at line $lineno — production was not modified" || true
    fi
  }

  # Prepend this deploy's commits (+ Spira tickets) to the served changelog.
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
    COMMITS=$(git log --no-merges --pretty=format:'  %h  %ad  %s' --date=short "${RANGE[@]}")
    # Ticket ids: the Spira project keys that ship out of this repo, plus the legacy COS- ones
    # inherited from Linear. An explicit list rather than a generic KEY-N pattern, which would
    # also drag in UTF-8 or SHA-256 — a new project deploying from here gets added here too.
    # Sorted on prefix *and* number: `-u` dedupes on the sort keys alone, so keying on the number
    # only would have kept one of IKN-51 / PFA-51 and dropped the other.
    TICKETS=$(printf '%s\n' "$COMMITS" \
      | grep -oiE '(COS|PFA|IKN)-[0-9]+' | tr 'a-z' 'A-Z' | sort -u -t- -k1,1 -k2,2n | paste -sd ',' - | sed 's/,/, /g' || true)

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

  log "➡️  Preparing staging directory on remote server: $STAGING_DIR"

  ssh "$REMOTE_USER_HOST" \
    RELEASES_DIR="$RELEASES_DIR" \
    STAGING_DIR="$STAGING_DIR" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

mkdir -p "$RELEASES_DIR"
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
EOF

  log "➡️  Uploading front sources to staging (excluding node_modules/.next/out)"
  rsync -az --delete \
    --exclude ".git" \
    --exclude ".next" \
    --exclude "node_modules" \
    --exclude "out" \
    --exclude ".env.local" \
    --exclude ".env*.local" \
    --exclude ".DS_Store" \
    "$SCRIPT_DIR"/ "$REMOTE_USER_HOST:$STAGING_DIR/"

  log "➡️  Installing dependencies and building Next.js on remote server"
  ssh "$REMOTE_USER_HOST" \
    STAGING_DIR="$STAGING_DIR" \
    CURRENT_DIR="$CURRENT_DIR" \
    PM2_ECOSYSTEM_FILE="$PM2_ECOSYSTEM_FILE" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

export PATH="/home/debian/.npm-global/bin:/home/debian/.local/share/pnpm:/usr/local/bin:/usr/bin:/bin:/usr/sbin:$PATH"

cd "$STAGING_DIR"

command -v pnpm >/dev/null 2>&1 || {
  echo "❌ ERROR: pnpm is not installed on the remote server" >&2
  exit 1
}

command -v pm2 >/dev/null 2>&1 || {
  echo "❌ ERROR: pm2 is not installed on the remote server" >&2
  exit 1
}

for env_file in .env.production.local .env.production .env; do
  if [ -f "$CURRENT_DIR/$env_file" ] && [ ! -f "$STAGING_DIR/$env_file" ]; then
    cp "$CURRENT_DIR/$env_file" "$STAGING_DIR/$env_file"
  fi
done

pnpm install --frozen-lockfile
pnpm build

if [ ! -f "$PM2_ECOSYSTEM_FILE" ]; then
  echo "❌ ERROR: Missing $PM2_ECOSYSTEM_FILE in release" >&2
  exit 1
fi
EOF

  log "➡️  Performing atomic release switch (with server-side backup, keeping releases/)"

  ssh "$REMOTE_USER_HOST" \
    CURRENT_DIR="$CURRENT_DIR" \
    BACKUP_DIR="$BACKUP_DIR" \
    STAGING_DIR="$STAGING_DIR" \
    WEB_ROOT_BASE="$WEB_ROOT_BASE" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

cd "$WEB_ROOT_BASE"

if [ ! -d "$STAGING_DIR" ]; then
  echo "❌ ERROR: Staging directory $STAGING_DIR does not exist" >&2
  exit 1
fi

rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

mkdir -p "$CURRENT_DIR"
cd "$CURRENT_DIR"

TMP_RELEASES_DIR="$WEB_ROOT_BASE/.releases_tmp_switch"

if [ -d "releases" ]; then
  rm -rf "$TMP_RELEASES_DIR"
  mv "releases" "$TMP_RELEASES_DIR"
fi

shopt -s dotglob
if compgen -G "*" > /dev/null; then
  mv * "$BACKUP_DIR"/ 2>/dev/null || true
fi
shopt -u dotglob

if [ -d "$TMP_RELEASES_DIR" ]; then
  mv "$TMP_RELEASES_DIR" "$CURRENT_DIR/releases"
fi

cp -a "$STAGING_DIR"/. "$CURRENT_DIR"/

echo "✅ New release activated from $STAGING_DIR"
EOF

  SWITCH_DONE="true"

  log "➡️  Reloading PM2 from ecosystem"
  remote_pm2_reload

  trap - ERR

  write_deploy_log || log "⚠️  Deploy changelog update skipped (non-fatal)"
  zeus_report "success" || log "⚠️  Zeus was not told about this deploy (non-fatal)"

  log "✅ Deployment completed successfully"
  log "ℹ️  Next.js app settings are read from $PM2_ECOSYSTEM_FILE"
  log "ℹ️  Previous version is available in: $BACKUP_DIR"
  log "ℹ️  All releases are stored under: $RELEASES_DIR"
  log "ℹ️  You can manually rollback with: ./deploy-front.sh rollback"
}

rollback() {
  log "↩️  Manual rollback to previous version"

  # A manual rollback is reported for the same reason an automatic one is: it changes what is live,
  # and Zeus's whole claim is to know which build each service is serving. It ships no commits — see
  # `zeus_commits_json` — and names no release, because the release it restores is whatever was in
  # the backup directory and this script never learns its name.
  ZEUS_STARTED_AT=$(date -u +%FT%TZ)
  ZEUS_STARTED_EPOCH=$(date +%s)
  ZEUS_REPORT_COMMITS="false"

  if remote_rollback; then
    log "➡️  Reloading PM2 from ecosystem"
    remote_pm2_reload
    zeus_report "rolled_back" "manual rollback — the previous release is live again" || true
    log "✅ Rollback completed. Previous version is now live."
  else
    log "❌ Rollback failed. Check server state manually."
    zeus_report "failed" "manual rollback failed — ks-b needs looking at" || true
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
