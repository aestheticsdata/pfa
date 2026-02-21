#!/usr/bin/env bash
set -Eeuo pipefail

######################################
# Configuration
######################################
REMOTE_USER_HOST="debian@ks-b"

# Base dir for the API on the server
API_ROOT="/var/www/pfa"

# Paths on the server
NEST_DIR="$API_ROOT/nest-api"
NEST_BACKUP_DIR="$API_ROOT/nest-api.bak"
NEST_RELEASES_DIR="$API_ROOT/nest-api-releases"

# Local project dir (script location = repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load DATABASE_URL from nest-api/.env (required for prisma generate during Nest build)
NEST_ENV="$SCRIPT_DIR/nest-api/.env"
if [ -f "$NEST_ENV" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$NEST_ENV"
  set +a
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ ERROR: DATABASE_URL is not set. Required for Nest/Prisma build." >&2
  echo "   Add it to nest-api/.env or run: export DATABASE_URL='mysql://...'" >&2
  exit 1
fi

######################################
# Utility functions
######################################

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
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

echo "✅ API rollback done on server (restored from backup)"
EOF
}

deploy() {
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

  ######################################
  # Error handler (rollback if needed)
  ######################################
  on_error() {
    local lineno=$1
    log "❌ ERROR: API deployment failed at line $lineno"

    if [[ "$SWITCH_DONE" == "true" ]]; then
      log "↩️  Auto rollback: switching API back to previous version"
      if remote_rollback; then
        log "✅ Auto rollback succeeded"
        log "➡️  Reloading API with pm2 after rollback"
        restart_pm2
      else
        log "❌ Auto rollback failed, manual intervention required"
      fi
    else
      log "ℹ️  No rollback needed: API production was not modified yet"
    fi
  }

  restart_pm2() {
    ssh "$REMOTE_USER_HOST" \
      API_ROOT="$API_ROOT" \
      'bash -s' << 'EOF'
set -Eeuo pipefail
cd "$API_ROOT"
pm2 reload ecosystem.config.js --env production 2>/dev/null || pm2 start ecosystem.config.js --env production
EOF
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
  # Rsync Nest API
  ######################################
  log "➡️  Syncing Nest API source to release directory (rsync)"

  rsync -az \
    --delete \
    --exclude=".git" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude=".DS_Store" \
    --exclude="prisma.config.js" \
    --exclude="prisma.config.js.map" \
    --exclude="prisma.config.d.ts" \
    "$SCRIPT_DIR/nest-api/" \
    "$REMOTE_USER_HOST":"$NEST_RELEASE_REMOTE/"

  ######################################
  # Rsync ecosystem.config.js
  ######################################
  log "➡️  Syncing ecosystem.config.js"

  scp "$SCRIPT_DIR/ecosystem.config.js" "$REMOTE_USER_HOST:$API_ROOT/ecosystem.config.js"

  ######################################
  # Switch current ↔ backup (atomic)
  ######################################
  log "➡️  Performing atomic API release switch with backup"

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
  echo "❌ ERROR: Nest release is empty (no package.json in $NEST_RELEASE_REMOTE)" >&2
  exit 1
fi

rm -rf "$NEST_BACKUP_DIR"

if [ -d "$NEST_DIR" ]; then
  mv "$NEST_DIR" "$NEST_BACKUP_DIR"
fi

mv "$NEST_RELEASE_REMOTE" "$NEST_DIR"

echo "✅ New API release activated"
EOF

  SWITCH_DONE="true"

  ######################################
  # Fresh install + build + restart via pm2
  ######################################
  log "➡️  Installing dependencies and building on server"

  ssh "$REMOTE_USER_HOST" \
    NEST_DIR="$NEST_DIR" \
    API_ROOT="$API_ROOT" \
    DATABASE_URL="$DATABASE_URL" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

export PATH="$HOME/.local/share/pnpm:$PATH"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm is not installed on this server (required for API deploy)" >&2
  exit 1
fi

# Nest: install + build (DATABASE_URL needed for prisma generate)
cd "$NEST_DIR"
rm -rf node_modules dist
pnpm install
export DATABASE_URL
pnpm build

# Start or reload Nest with pm2
cd "$API_ROOT"
pm2 reload ecosystem.config.js --env production 2>/dev/null || pm2 start ecosystem.config.js --env production
EOF

  trap - ERR

  log "✅ API deployment completed successfully"
  log "ℹ️  Nest API (port 6100) is running"
  log "ℹ️  Previous version is available in: $NEST_BACKUP_DIR"
  log "ℹ️  You can manually rollback with: ./deploy-api.sh rollback"
}

rollback() {
    log "↩️  Manual rollback to previous API version"
  if remote_rollback; then
    log "➡️  Reloading API with pm2 after rollback"
    ssh "$REMOTE_USER_HOST" \
      API_ROOT="$API_ROOT" \
      'bash -s' << 'EOF'
set -Eeuo pipefail
cd "$API_ROOT"
pm2 reload ecosystem.config.js --env production 2>/dev/null || pm2 start ecosystem.config.js --env production
EOF
    log "✅ Manual API rollback completed. Previous version is now live."
  else
    log "❌ Rollback failed. Check server state manually."
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
