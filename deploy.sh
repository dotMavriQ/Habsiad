#!/bin/bash

# Habsiad Plugin Deployment Script
# This script builds the plugin and deploys it to both main and release branches

set -e  # Exit on any error

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Helper functions for output
print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}
print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Configuration
REPO_PATH="$(pwd)"
PLUGIN_PATH="/home/dotmavriq/Documents/LIFE/.obsidian/plugins/Habsiad"
BACKUP_PATH="${PLUGIN_PATH}-backup"

print_step "Starting Habsiad Plugin Deployment..."

# Step 1: Ensure we're on main branch and it's clean
print_info "Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
    print_error "Working directory is not clean. Please commit or stash your changes."
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    print_info "Switching to main branch..."
    git checkout main
fi

# Step 2: Build the plugin
print_step "Building the TypeScript plugin..."
if npm run build; then
    print_success "Build completed successfully."
else
    print_error "Build failed. Aborting deployment."
    exit 1
fi

# Step 3: Get version from manifest.json
VERSION=$(grep -o '"version": "[^"]*' manifest.json | grep -o '[^"]*$')
print_info "Detected version: $VERSION"

# Step 4: Commit and push changes to main
print_step "Committing changes to main branch..."
git add .
if git diff --cached --quiet; then
    print_info "No changes to commit on main branch."
else
    git commit -m "Build version $VERSION"
    git push origin main
    print_success "Changes pushed to main branch."
fi

# Step 5: Create or update release branch
print_step "Creating/updating release branch..."

# Stash any uncommitted changes first
git stash push -m "Temporary stash for deployment" || true

# Check if release branch exists
if git show-ref --verify --quiet refs/heads/release; then
    print_info "Release branch exists, switching to it..."
    git checkout release
    # Reset release branch to be clean
    git reset --hard HEAD~100 2>/dev/null || git reset --hard $(git rev-list --max-parents=0 HEAD)
else
    print_info "Creating new release branch..."
    # Create orphan branch (no history)
    git checkout --orphan release
fi

# Step 6: Clean release branch and add only necessary files
print_info "Preparing clean release branch..."

# Remove all files from index
git rm -rf . 2>/dev/null || true

# Copy only the essential plugin files from main branch using git show
print_info "Copying essential plugin files..."
git show main:main.js > main.js
git show main:manifest.json > manifest.json  
git show main:styles.css > styles.css

# Copy main.js.map if it exists
if git cat-file -e main:main.js.map 2>/dev/null; then
    git show main:main.js.map > main.js.map
fi

# Copy LICENSE if it exists
if git cat-file -e main:LICENSE 2>/dev/null; then
    git show main:LICENSE > LICENSE
fi

# Create a minimal README for the release branch
cat > README.md << EOF
# Habsiad - Obsidian Plugin

This is the release branch containing only the compiled plugin files.

For source code and development, see the main branch.

## Installation

Download the latest release from the GitHub releases page.

## Version

Current version: $VERSION
EOF

# Step 7: Commit release branch
git add .
if git diff --cached --quiet; then
    print_info "No changes to commit on release branch."
else
    git commit -m "Release version $VERSION - compiled plugin files"
    print_success "Release branch updated with compiled files."
fi

# Step 8: Create/update tag
TAG_NAME="v$VERSION"
print_info "Creating/updating tag: $TAG_NAME"

# Delete tag if it exists (locally and remotely)
if git tag -l | grep -q "^$TAG_NAME$"; then
    git tag -d "$TAG_NAME" || true
    git push origin ":refs/tags/$TAG_NAME" 2>/dev/null || true
fi

# Create new tag
git tag -a "$TAG_NAME" -m "Release version $VERSION"

# Step 9: Push release branch and tag
print_step "Pushing release branch and tag..."
git push origin release --force
git push origin "$TAG_NAME"
print_success "Release branch and tag pushed successfully."

# Step 10: Update local Obsidian plugin (if path exists)
if [[ -d "$PLUGIN_PATH" ]]; then
    print_step "Updating local Obsidian plugin..."
    
    # Create backup
    if [[ -d "$PLUGIN_PATH" ]]; then
        print_info "Creating backup of current plugin..."
        mkdir -p "$BACKUP_PATH"
        rm -rf "$BACKUP_PATH"/* 2>/dev/null || true
        cp -r "$PLUGIN_PATH"/* "$BACKUP_PATH"/ 2>/dev/null || true
    fi
    
    # Copy new files
    cp main.js "$PLUGIN_PATH/main.js"
    cp manifest.json "$PLUGIN_PATH/manifest.json"
    cp styles.css "$PLUGIN_PATH/styles.css"
    
    # Preserve user data
    if [[ -f "$BACKUP_PATH/data.json" ]]; then
        cp "$BACKUP_PATH/data.json" "$PLUGIN_PATH/data.json"
    fi
    if [[ -f "$BACKUP_PATH/habsiad-settings.json" ]]; then
        cp "$BACKUP_PATH/habsiad-settings.json" "$PLUGIN_PATH/habsiad-settings.json"
    fi
    
    print_success "Local Obsidian plugin updated."
else
    print_info "Local Obsidian plugin path not found. Skipping local update."
fi

# Step 11: Return to main branch
print_step "Returning to main branch..."
git checkout main

# Restore any stashed changes
git stash pop 2>/dev/null || true

# Step 12: Summary
print_success "Deployment completed successfully!"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "  • Main branch: Updated with source code"
echo "  • Release branch: Contains only compiled plugin files"
echo "  • Tag: $TAG_NAME created and pushed"
echo "  • Local plugin: Updated (if path exists)"
echo ""
echo -e "${YELLOW}For Obsidian Plugin Repository submission:${NC}"
echo "  • Use the 'release' branch"
echo "  • Point to repository: dotMavriQ/Habsiad"
echo "  • Branch: release (not main)"
echo ""
echo -e "${GREEN}Ready for plugin repository submission!${NC}"
