#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
URL="${URL:-http://127.0.0.1:6010}"
ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Production}"
NO_BUILD="${NO_BUILD:-0}"

API_PROJECT="$PROJECT_ROOT/backend/src/qMRI.Api/qMRI.Api.csproj"
API_DIR="$PROJECT_ROOT/backend/src/qMRI.Api"
LOG_DIR="$PROJECT_ROOT/logs"
OUT_LOG="$LOG_DIR/seed-topp-api.out.log"
ERR_LOG="$LOG_DIR/seed-topp-api.err.log"

if [[ ! -f "$API_PROJECT" ]]; then
  echo "API project not found at $API_PROJECT" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"
rm -f "$OUT_LOG" "$ERR_LOG"

if [[ "$NO_BUILD" != "1" ]]; then
  dotnet build "$API_PROJECT" --no-restore
fi

export ASPNETCORE_ENVIRONMENT
export ASPNETCORE_URLS="$URL"

(
  cd "$API_DIR"
  dotnet run --no-build --project "$API_PROJECT" --urls "$URL" >"$OUT_LOG" 2>"$ERR_LOG"
) &
API_PID=$!

cleanup() {
  if kill -0 "$API_PID" >/dev/null 2>&1; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

HEALTH_URI="$URL/api/v1/health"
SEED_URI="$URL/api/v1/admin/seed/topp"
STARTED=0

for _ in $(seq 1 45); do
  if ! kill -0 "$API_PID" >/dev/null 2>&1; then
    echo "Temporary API exited early. Check $OUT_LOG and $ERR_LOG" >&2
    exit 1
  fi

  if curl -fsS "$HEALTH_URI" >/dev/null 2>&1; then
    STARTED=1
    break
  fi

  sleep 2
done

if [[ "$STARTED" != "1" ]]; then
  echo "Temporary API did not become healthy at $HEALTH_URI. Check $OUT_LOG and $ERR_LOG" >&2
  exit 1
fi

curl -fsS \
  -X POST "$SEED_URI" \
  -H 'Content-Type: application/json' \
  --max-time 180 \
  --data '{"overwriteExisting":true}'

echo
echo "TOPP seed completed."
