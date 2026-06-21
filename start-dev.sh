#!/usr/bin/env bash

# Start minaki-billing-system (production app) + real-time-minaki-poc API

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR/../real-time-minaki-poc/api"

TUNNEL_FLAG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tunnel | -t)
      TUNNEL_FLAG=1
      shift
      ;;
    --no-tunnel)
      TUNNEL_FLAG=0
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Try: ./start-dev.sh [--tunnel|-t] [--no-tunnel]" >&2
      exit 1
      ;;
  esac
done

if [[ -n "$TUNNEL_FLAG" ]]; then
  USE_TUNNEL="$TUNNEL_FLAG"
else
  USE_TUNNEL=1
fi

echo -e "${GREEN}🚀 Starting Minaki Billing + Agents API${NC}"
if [[ "${USE_TUNNEL}" == "1" ]]; then
  echo -e "${YELLOW}Homelab Postgres tunnel auto-starts (pass --no-tunnel to skip)${NC}"
else
  echo -e "${YELLOW}Homelab Postgres tunnel disabled (--no-tunnel)${NC}"
fi

if [ ! -f "$SCRIPT_DIR/.env.local" ] && [ -f "$SCRIPT_DIR/.env.example" ]; then
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env.local"
    echo -e "${YELLOW}Created .env.local from .env.example${NC}"
fi

echo -e "${YELLOW}Starting API (port 8001)...${NC}"
cd "$API_DIR"

if [[ -f .env ]]; then
  # shellcheck disable=1091
  set -a && source ./.env && set +a
fi

export TUNNEL_SKIP_REDIS=1

# shellcheck source=scripts/homelab_tunnel.sh
source "$API_DIR/scripts/homelab_tunnel.sh"

cleanup() {
    if [[ "${CLEANUP_DONE:-0}" == "1" ]]; then
        return
    fi
    CLEANUP_DONE=1
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"
    if [[ "${USE_TUNNEL}" == "1" ]]; then
        homelab_tunnel_stop
    fi
    [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null || true
    [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    echo -e "${GREEN}✅ Stopped${NC}"
}
trap cleanup SIGINT SIGTERM EXIT

if [[ "${USE_TUNNEL}" == "1" ]]; then
    if ! homelab_tunnel_start; then
        echo -e "${YELLOW}❌ Failed to start homelab Postgres tunnel. Check api/.env (HOMELAB_SSH_TARGET, SSH_KEY) or pass --no-tunnel.${NC}" >&2
        exit 1
    fi
fi

[ ! -d "venv" ] && python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

echo -e "${YELLOW}Starting billing frontend (port 3000)...${NC}"
cd "$SCRIPT_DIR"
[ ! -d "node_modules" ] && npm install
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}✅ Servers running:${NC}"
echo -e "  Billing + Agents: http://localhost:3000/agents/writer"
echo -e "  Backend:          http://localhost:8001"
echo -e "  API Docs:         http://localhost:8001/docs"
if [[ "${USE_TUNNEL}" == "1" ]]; then
  echo -e "  Postgres:         tunneled via 127.0.0.1:${LOCAL_PG_PORT:-15432} (use --no-tunnel to skip)"
else
  echo -e "  Postgres:         no tunnel (use --tunnel or omit --no-tunnel to enable)"
fi
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"

wait
