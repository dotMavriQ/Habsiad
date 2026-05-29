# A/B Testing Setup: Habsiad vs Habsiad Refactored

## Overview
This document outlines the A/B testing configuration for comparing the original Habsiad plugin against the refactored version (Habsiad Refactored) to validate performance improvements and feature parity.

## Plugin Versions

### Original: Habsiad
- **ID**: `habsiad`
- **Name**: "Habsiad"
- **Architecture**: Monolithic main.ts (1572 lines)
- **Branch**: `main`
- **Bundle Size**: ~35KB
- **Status**: Production version

### Refactored: Habsiad Refactored  
- **ID**: `habsiad-refactored`
- **Name**: "Habsiad Refactored"
- **Architecture**: Modular (72.4% reduction → 434 lines main.ts)
- **Branch**: `refactor-v2`
- **Bundle Size**: ~25KB (15KB main.js)
- **Status**: Testing version

## Build Process

### Building Refactored Version
```bash
# From refactor-v2 branch
./build-refactored.sh
```

This script:
1. Temporarily modifies manifest.json with refactored plugin details
2. Builds the plugin with webpack
3. Creates deployment directory with refactored plugin files
4. Restores original manifest.json

### Installation for Testing
1. Copy `../habsiad-refactored-deploy/*` to Obsidian plugins folder as `habsiad-refactored/`
2. Enable both plugins in Obsidian settings
3. Compare functionality and performance

## Testing Matrix

### Performance Metrics
- [ ] **Startup Time**: Plugin load time on Obsidian start
- [ ] **Memory Usage**: RAM consumption comparison
- [ ] **Bundle Analysis**: JavaScript parsing and execution time
- [ ] **Command Response**: Latency for command execution
- [ ] **File Processing**: Large journal file processing speed

### Feature Parity
- [ ] **RetroTagger Modal**: Functionality and UI consistency
- [ ] **Habitica Sync**: API calls and data processing
- [ ] **Frontmatter Updates**: Field manipulation accuracy
- [ ] **Calorie Calculations**: Table parsing reliability
- [ ] **TODO Sync**: Task synchronization behavior
- [ ] **Settings Management**: Configuration persistence

### Code Quality Improvements
- [ ] **Type Safety**: Enhanced TypeScript compliance
- [ ] **Error Handling**: Better error messages and recovery
- [ ] **Modular Architecture**: Easier maintenance and debugging
- [ ] **API Integration**: Improved Habitica service reliability

## Architecture Comparison

### Original Structure
```
main.ts (1572 lines)
├── Plugin class
├── RetroTagger modal (566 lines)
├── All command handlers
├── Utility functions
└── Settings management
```

### Refactored Structure
```
main.ts (434 lines) - Coordination only
├── modals/
│   └── retroTagger.ts (566 lines)
├── commands/
│   ├── habiticaSync.ts
│   ├── frontmatterUpdates.ts
│   ├── utilityCommands.ts
│   └── calorieCalculations.ts
├── habitica/
│   ├── habiticaService.ts
│   └── types/ (modular type system)
└── utils/
    └── settingsSync.ts
```

## Expected Benefits
1. **Faster Loading**: Smaller main.js bundle for quicker parsing
2. **Better Memory Management**: Modular loading reduces memory footprint
3. **Enhanced Maintainability**: Isolated components easier to debug
4. **Improved Type Safety**: Comprehensive TypeScript coverage
5. **Better Error Handling**: More granular error reporting

## Testing Protocol
1. Install both versions simultaneously
2. Run identical workflows on both plugins
3. Monitor performance using browser DevTools
4. Document any behavioral differences
5. Measure user experience improvements

## Success Criteria
- ✅ Feature parity maintained (100% functionality match)
- ✅ Performance improvement (faster load times, lower memory)
- ✅ Better error handling and user feedback
- ✅ Easier debugging and maintenance
- ✅ Enhanced type safety and code quality
