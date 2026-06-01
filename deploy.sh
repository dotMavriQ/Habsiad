#!/bin/bash

# Habsiad local deploy: build the TypeScript plugin and copy the compiled
# artifacts into the live Obsidian vault for testing.
#
# This intentionally does NOT touch git branches/tags or GitHub — releasing is
# a separate, manual step. It only builds and installs into the vault.

set -euo pipefail

GREEN="\033[0;32m"; RED="\033[0;31m"; YELLOW="\033[0;33m"; BLUE="\033[0;34m"; NC="\033[0m"
info()    { echo -e "${YELLOW}[INFO]${NC} $1"; }
step()    { echo -e "${BLUE}[STEP]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }

REPO_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Live Obsidian vault. Override with HABSIAD_PLUGIN_PATH=/path ./deploy.sh
PLUGIN_PATH="${HABSIAD_PLUGIN_PATH:-/home/dotmavriq/Documents/NOTES/LIFE/.obsidian/plugins/Habsiad}"
BACKUP_PATH="${PLUGIN_PATH}-backup"

cd "$REPO_PATH"

step "Building the TypeScript plugin..."
npm run build
success "Build completed."

VERSION=$(grep -o '"version": "[^"]*' manifest.json | grep -o '[^"]*$')
info "Version: $VERSION"

if [[ ! -d "$PLUGIN_PATH" ]]; then
    error "Plugin path not found: $PLUGIN_PATH"
    error "Set HABSIAD_PLUGIN_PATH to your vault's .obsidian/plugins/Habsiad folder."
    exit 1
fi

# Back up the current install (compiled files + user data) before overwriting.
step "Backing up current plugin to $BACKUP_PATH ..."
mkdir -p "$BACKUP_PATH"
rm -rf "${BACKUP_PATH:?}/"* 2>/dev/null || true
cp -r "$PLUGIN_PATH"/. "$BACKUP_PATH"/ 2>/dev/null || true
success "Backup created."

# Copy compiled artifacts. data.json (user settings) is left untouched.
step "Installing compiled files into the vault..."
cp main.js "$PLUGIN_PATH/main.js"
cp manifest.json "$PLUGIN_PATH/manifest.json"
cp styles.css "$PLUGIN_PATH/styles.css"
if [[ -f main.js.map ]]; then
    cp main.js.map "$PLUGIN_PATH/main.js.map"
fi
success "Installed Habsiad v$VERSION into:"
echo "    $PLUGIN_PATH"
echo ""
info "Reload Obsidian (or toggle the plugin off/on) to load the new build."
