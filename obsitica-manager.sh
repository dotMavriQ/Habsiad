#!/bin/bash

# Paths
PLUGIN_PATH="/home/dotmavriq/Documents/LIFE/.obsidian/plugins/Obsitica"
REPO_PATH="/home/dotmavriq/Code/Obsitica/Obsitica"
BACKUP_PATH="${PLUGIN_PATH}-backup"

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

# Helper function for output
print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}
print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Check for mode
if [[ "$1" == "backup" ]]; then
    # Backup Mode: Restore from backup
    if [[ -d "$BACKUP_PATH" ]]; then
        print_info "Restoring backup..."
        rm -rf "$PLUGIN_PATH"/* && cp -r "$BACKUP_PATH"/* "$PLUGIN_PATH"
        print_success "Backup restored to $PLUGIN_PATH."
    else
        print_error "No backup found at $BACKUP_PATH. Cannot restore."
        exit 1
    fi
elif [[ "$1" == "normal" ]]; then
    # Normal Mode: Build, backup, export updates
    # Step 1: Build the TypeScript app
    print_info "Building the TypeScript app..."
    cd "$REPO_PATH" || exit 1
    if npm run build; then
        print_success "Build completed successfully."
    else
        print_error "Build failed. Aborting."
        exit 1
    fi

    # Step 2: Backup the current plugin
    print_info "Creating a backup of the current plugin..."
    mkdir -p "$BACKUP_PATH"
    rm -rf "$BACKUP_PATH"/* && cp -r "$PLUGIN_PATH"/* "$BACKUP_PATH"
    print_success "Backup created at $BACKUP_PATH."

    # Step 3: Export updated files
    print_info "Exporting updated files to the Obsidian plugin..."
    cp "$REPO_PATH/main.js" "$PLUGIN_PATH/main.js"
    cp "$REPO_PATH/manifest.json" "$PLUGIN_PATH/manifest.json"
    cp "$REPO_PATH/styles.css" "$PLUGIN_PATH/styles.css"
    print_success "Files exported to $PLUGIN_PATH."

    # Step 4: Confirm completion
    print_success "Normal mode operations completed successfully."
else
    # Invalid or missing argument
    print_error "Invalid mode. Usage: $0 [normal|backup]"
    exit 1
fi
