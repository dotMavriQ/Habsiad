#!/bin/bash

# Build script for Habsiad Refactored (A/B Testing Version)
# This creates a separate plugin with modified manifest for testing alongside the original

# Paths - using same pattern as habsiad-manager.sh
PLUGIN_PATH="/home/dotmavriq/Documents/LIFE/.obsidian/plugins/habsiad-refactored"
REPO_PATH="/home/dotmavriq/Code/Obsitica/Obsitica"

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

print_info "🔧 Building Habsiad Refactored for A/B Testing..."

# Create backup of original manifest
cp manifest.json manifest.json.backup

# Create refactored version manifest
cat > manifest.json << 'EOF'
{
	"id": "habsiad-refactored",
	"name": "Habsiad Refactored",
	"version": "2.0.0",
	"minAppVersion": "0.15.0",
	"description": "Refactored version of Habsiad - Habitica integration for Obsidian with enhanced modular architecture",
	"author": "dotMavriQ",
	"authorUrl": "https://github.com/dotMavriQ",
	"fundingUrl": {
		"Buy Me a Coffee": "https://www.buymeacoffee.com/dotmavriq"
	},
	"isDesktopOnly": false
}
EOF

# Build the plugin
print_info "📦 Building refactored plugin..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build successful!"
    
    # Create the plugin directory if it doesn't exist
    print_info "📁 Creating plugin directory: $PLUGIN_PATH"
    mkdir -p "$PLUGIN_PATH"
    
    # Copy built files directly to Obsidian plugins folder
    print_info "🚀 Deploying to Obsidian plugins folder..."
    cp main.js "$PLUGIN_PATH/"
    cp main.js.map "$PLUGIN_PATH/"
    cp manifest.json "$PLUGIN_PATH/"
    cp styles.css "$PLUGIN_PATH/"
    
    print_success "Refactored plugin deployed to: $PLUGIN_PATH"
    print_info "🧪 Ready for A/B testing!"
    print_info ""
    print_info "To test:"
    print_info "1. Restart Obsidian or reload plugins"
    print_info "2. Enable 'Habsiad Refactored' plugin in settings"
    print_info "3. Compare performance with original 'Habsiad' plugin"
    print_info "4. Both plugins can run simultaneously!"
else
    print_error "Build failed!"
fi

# Restore original manifest
mv manifest.json.backup manifest.json

print_info "🔄 Original manifest restored"
print_success "Deployment complete! You can now test both Habsiad versions side by side."
