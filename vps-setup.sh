#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# SECPORT VPS SETUP SCRIPT
# Run this ONCE on a fresh Ubuntu 22.04 VPS to install Docker and deploy
# Usage: bash vps-setup.sh
# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
err()  { echo -e "${RED}✗ ERROR:${NC} $1"; exit 1; }
info() { echo -e "${CYAN}→${NC} $1"; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║      SECPORT VPS SETUP SCRIPT        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# ── 1. Update system ──────────────────────────────────────────────────────────
info "Updating system packages..."
apt update -qq && apt upgrade -y -qq
ok "System updated"

# ── 2. Install Docker ─────────────────────────────────────────────────────────
if command -v docker &>/dev/null; then
  ok "Docker already installed: $(docker --version)"
else
  info "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  ok "Docker installed"
fi

# ── 3. Install Docker Compose plugin ─────────────────────────────────────────
if docker compose version &>/dev/null; then
  ok "Docker Compose already installed"
else
  info "Installing Docker Compose plugin..."
  apt install -y docker-compose-plugin -qq
  ok "Docker Compose installed"
fi

# ── 4. Configure firewall ─────────────────────────────────────────────────────
info "Configuring UFW firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp   # HTTP/3
echo "y" | ufw enable
ok "Firewall configured (SSH + 80 + 443)"

# ── 5. Clone repo ─────────────────────────────────────────────────────────────
echo ""
read -p "$(echo -e ${BOLD}Enter your GitHub repo URL:${NC} )" REPO_URL
if [ -z "$REPO_URL" ]; then
  err "Repo URL is required"
fi

PROJECT_DIR="/opt/secport"
if [ -d "$PROJECT_DIR" ]; then
  info "Project directory exists — pulling latest..."
  cd "$PROJECT_DIR" && git pull
else
  info "Cloning repo to $PROJECT_DIR..."
  git clone "$REPO_URL" "$PROJECT_DIR"
fi
cd "$PROJECT_DIR"
ok "Repo ready at $PROJECT_DIR"

# ── 6. Create .env ────────────────────────────────────────────────────────────
if [ -f ".env" ]; then
  ok ".env already exists — skipping"
else
  echo ""
  echo -e "${BOLD}Setting up environment variables:${NC}"
  read -p "Your domain (e.g. secport.yourdomain.com): " DOMAIN
  read -p "Admin username [admin]: " ADMIN_USER
  ADMIN_USER=${ADMIN_USER:-admin}
  read -s -p "Admin password: " ADMIN_PASS
  echo ""

  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)

  cat > .env << EOF
DOMAIN=$DOMAIN
MONGODB_URI=mongodb://mongo:27017/secport
JWT_SECRET=$JWT_SECRET
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASS
NEXT_PUBLIC_APP_URL=https://$DOMAIN
EOF

  ok ".env created"
fi

# ── 7. Copy required files ────────────────────────────────────────────────────
info "Checking required files..."
[ -f "Dockerfile" ]         || err "Dockerfile missing — copy from docker/ folder"
[ -f "docker-compose.yml" ] || err "docker-compose.yml missing"
[ -f "Caddyfile" ]          || err "Caddyfile missing"
ok "All required files present"

# ── 8. Build and start ───────────────────────────────────────────────────────
info "Building and starting containers..."
docker compose down --remove-orphans 2>/dev/null
docker compose build --no-cache
docker compose up -d
ok "Containers started"

# ── 9. Health check ───────────────────────────────────────────────────────────
info "Waiting for app to start..."
sleep 8
if docker compose ps | grep -q "Up"; then
  ok "All containers running"
  docker compose ps
else
  err "Some containers failed to start. Run: docker compose logs"
fi

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║         SETUP COMPLETE ✓             ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Site:${NC}    https://$(grep DOMAIN .env | cut -d= -f2)"
echo -e "  ${BOLD}Logs:${NC}    docker compose logs -f"
echo -e "  ${BOLD}Update:${NC}  bash update.sh"
echo ""
