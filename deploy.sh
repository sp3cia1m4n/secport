#!/bin/bash

# ─────────────────────────────────────────────────────────────────────────────
# SECPORT DEPLOY SCRIPT
# Usage: ./deploy.sh <source_file> [destination] [commit message]
#
# Examples:
#   ./deploy.sh index.jsx                        → copies to pages/index.jsx
#   ./deploy.sh index.jsx /pages/index.jsx       → same, explicit destination
#   ./deploy.sh login.js /pages/api/auth/login.js
#   ./deploy.sh globals.css /styles/globals.css  → "updated globals.css"
# ─────────────────────────────────────────────────────────────────────────────

# ── CONFIG — change these if your paths ever change ──────────────────────────
SOURCE_DIR="/mnt/hgfs/ubuntu-share/claude"
PORTFOLIO_DIR="$HOME/secport2/secport/myportfolio"
# ─────────────────────────────────────────────────────────────────────────────

# ── COLORS ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

ok()   { echo -e "${GREEN}✓${NC} $1"; }
err()  { echo -e "${RED}✗ ERROR:${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
info() { echo -e "${CYAN}→${NC} $1"; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       SECPORT DEPLOY SCRIPT          ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# ── CHECK ARGS ────────────────────────────────────────────────────────────────
if [ -z "$1" ]; then
  echo -e "${BOLD}Usage:${NC}"
  echo "  ./deploy.sh <filename> [destination] [commit message]"
  echo ""
  echo -e "${BOLD}Examples:${NC}"
  echo "  ./deploy.sh index.jsx"
  echo "  ./deploy.sh index.jsx /pages/index.jsx"
  echo "  ./deploy.sh login.js /pages/api/auth/login.js \"fix admin login\""
  echo "  ./deploy.sh globals.css /styles/globals.css"
  echo ""
  exit 0
fi

FILE_NAME="$1"
DEST_PATH="$2"
COMMIT_MSG="$3"

# ── RESOLVE SOURCE FILE ───────────────────────────────────────────────────────
SOURCE_FILE="$SOURCE_DIR/$FILE_NAME"

info "Looking for source file: $SOURCE_FILE"

if [ ! -f "$SOURCE_FILE" ]; then
  err "Source file not found: $SOURCE_FILE\n  Make sure the file is in $SOURCE_DIR"
fi
ok "Source file found"

# ── RESOLVE DESTINATION ───────────────────────────────────────────────────────
# If no destination given, auto-detect based on file extension + name
if [ -z "$DEST_PATH" ]; then
  EXT="${FILE_NAME##*.}"
  case "$EXT" in
    jsx|js|ts|tsx)
      # Default JS/JSX files go to pages/
      DEST_PATH="/pages/$FILE_NAME"
      ;;
    css)
      DEST_PATH="/styles/$FILE_NAME"
      ;;
    *)
      DEST_PATH="/$FILE_NAME"
      ;;
  esac
  warn "No destination given — defaulting to $DEST_PATH"
fi

# Strip leading slash for joining
DEST_REL="${DEST_PATH#/}"
FULL_DEST="$PORTFOLIO_DIR/$DEST_REL"

# ── CHECK PORTFOLIO DIR ───────────────────────────────────────────────────────
if [ ! -d "$PORTFOLIO_DIR" ]; then
  err "Portfolio directory not found: $PORTFOLIO_DIR\n  Update PORTFOLIO_DIR in this script."
fi
ok "Portfolio directory found"

# ── CHECK GIT ─────────────────────────────────────────────────────────────────
if ! command -v git &> /dev/null; then
  err "git is not installed. Run: sudo apt install git"
fi

cd "$PORTFOLIO_DIR" || err "Cannot cd into $PORTFOLIO_DIR"

if [ ! -d ".git" ]; then
  err "Not a git repository. Run: git init inside $PORTFOLIO_DIR"
fi
ok "Git repository found"

# ── CHECK REMOTE ──────────────────────────────────────────────────────────────
REMOTE=$(git remote get-url origin 2>/dev/null)
if [ -z "$REMOTE" ]; then
  err "No git remote set. Run: git remote add origin https://github.com/sp3cia1m4n/secport.git"
fi
ok "Remote: $REMOTE"

# ── CHECK INTERNET ────────────────────────────────────────────────────────────
info "Checking internet connection..."
if ! ping -c 1 github.com &> /dev/null; then
  err "Cannot reach github.com — check your internet connection"
fi
ok "Internet connection OK"

# ── CREATE DESTINATION FOLDER IF NEEDED ──────────────────────────────────────
DEST_DIR=$(dirname "$FULL_DEST")
if [ ! -d "$DEST_DIR" ]; then
  warn "Destination folder doesn't exist: $DEST_DIR"
  info "Creating folder..."
  mkdir -p "$DEST_DIR" || err "Failed to create directory: $DEST_DIR"
  ok "Folder created"
fi

# ── SHOW DIFF SUMMARY ────────────────────────────────────────────────────────
if [ -f "$FULL_DEST" ]; then
  OLD_LINES=$(wc -l < "$FULL_DEST")
  NEW_LINES=$(wc -l < "$SOURCE_FILE")
  DIFF=$((NEW_LINES - OLD_LINES))
  if [ $DIFF -gt 0 ]; then
    DIFF_STR="+$DIFF lines"
  elif [ $DIFF -lt 0 ]; then
    DIFF_STR="$DIFF lines"
  else
    DIFF_STR="same line count"
  fi
  info "File change: $OLD_LINES → $NEW_LINES lines ($DIFF_STR)"
else
  info "New file — will be created"
fi

# ── COPY FILE ────────────────────────────────────────────────────────────────
info "Copying $FILE_NAME → $DEST_REL"
cp "$SOURCE_FILE" "$FULL_DEST" || err "Failed to copy file"
ok "File copied"

# ── BUILD CHECK ──────────────────────────────────────────────────────────────
info "Checking for syntax errors..."
if command -v node &> /dev/null; then
  # Quick JS/JSX syntax check via node
  EXT="${FILE_NAME##*.}"
  if [[ "$EXT" == "js" ]]; then
    node --check "$FULL_DEST" 2>/dev/null && ok "Syntax OK" || warn "Possible syntax issue — check the file"
  else
    ok "Syntax check skipped for .$EXT file (deploy anyway)"
  fi
fi

# ── GIT STATUS ───────────────────────────────────────────────────────────────
echo ""
info "Git status:"
git status --short
echo ""

# ── CONFIRM ───────────────────────────────────────────────────────────────────
echo -e "${BOLD}Ready to commit and push:${NC}"
echo -e "  File:    ${CYAN}$DEST_REL${NC}"
echo -e "  Remote:  ${CYAN}$REMOTE${NC}"
echo ""
read -p "$(echo -e ${BOLD}Continue? [Y/n]:${NC} )" CONFIRM
CONFIRM=${CONFIRM:-Y}

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  warn "Aborted. File was copied but NOT committed."
  exit 0
fi

# ── AUTO COMMIT MESSAGE ───────────────────────────────────────────────────────
if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="update $DEST_REL"
fi

# ── GIT ADD + COMMIT + PUSH ───────────────────────────────────────────────────
info "Staging files..."
git add . || err "git add failed"
ok "Files staged"

info "Committing: \"$COMMIT_MSG\""
COMMIT_OUT=$(git commit -m "$COMMIT_MSG" 2>&1)
if echo "$COMMIT_OUT" | grep -q "nothing to commit"; then
  warn "Nothing new to commit — file may already be staged. Pushing anyway..."
elif echo "$COMMIT_OUT" | grep -q "error\|fatal"; then
  err "git commit failed: $COMMIT_OUT"
else
  ok "Committed"
fi

info "Pushing to GitHub..."
git push || err "git push failed — check your token/internet connection"
ok "Pushed to GitHub!"

# ── DONE ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║           DEPLOY COMPLETE ✓          ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}GitHub:${NC}  https://github.com/sp3cia1m4n/secport"
echo -e "  ${BOLD}Local:${NC}   http://localhost:3000"
echo ""