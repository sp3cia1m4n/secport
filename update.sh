#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# SECPORT UPDATE SCRIPT
# Run on VPS to pull latest code and redeploy
# Usage: bash update.sh
# ─────────────────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${CYAN}→${NC} $1"; }

cd /opt/secport || { echo "Project not found at /opt/secport"; exit 1; }

echo ""
echo -e "${BOLD}── SECPORT UPDATE ──────────────────────${NC}"

info "Pulling latest from GitHub..."
git pull
ok "Code updated"

info "Rebuilding app container..."
docker compose build app --no-cache
ok "Build complete"

info "Restarting app..."
docker compose up -d --no-deps app
ok "App restarted"

info "Status:"
docker compose ps

echo ""
echo -e "${GREEN}${BOLD}Update complete ✓${NC}"
echo -e "Logs: docker compose logs -f app"
echo ""
