#!/usr/bin/env bash
# Launches Redis for e2e tests. Starts redis-server if not already running.
# Uses default localhost:6379. For custom REDIS_URL, ensure Redis is already running.

if ! command -v redis-cli &>/dev/null; then
  echo "Error: redis-cli not found. Install Redis (e.g. brew install redis) and retry."
  exit 1
fi

redis_ping() {
  redis-cli ping 2>/dev/null | grep -q PONG
}

if ! redis_ping; then
  echo "Redis not running. Starting redis-server..."
  if command -v redis-server &>/dev/null; then
    redis-server --daemonize yes 2>/dev/null || redis-server &
  else
    echo "Error: redis-server not found. Install Redis and retry."
    exit 1
  fi
  for i in $(seq 1 10); do
    sleep 1
    if redis_ping; then
      echo "Redis is ready."
      break
    fi
    if [ "$i" -eq 10 ]; then
      echo "Error: Redis failed to start. Run 'redis-server' manually and retry."
      exit 1
    fi
  done
fi
