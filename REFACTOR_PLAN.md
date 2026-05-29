# Habsiad Refactor v2 Plan

## 🎯 Goals
1. **Update Habitica API compatibility** - Address new API requirements
2. **Modularize main.ts** - Break down 1572-line monolith
3. **Improve type safety** - Expand TypeScript definitions
4. **Enhance error handling** - Better API error management
5. **Maintain backward compatibility** - Don't break existing functionality

## 📊 Current State Analysis

### Issues Found:
- **main.ts**: 1572 lines - contains plugin class + RetroTagger modal
- **habiticaService.ts**: Only 62 lines with 2 basic methods
- **types.ts**: Minimal interface definitions
- **API patterns**: May be outdated for current Habitica API

### Strengths:
- ✅ Well-organized views and settings
- ✅ Cross-device sync functionality  
- ✅ Comprehensive deployment pipeline
- ✅ Active maintenance and documentation

## 🔧 Refactoring Strategy

### Phase 1: Code Analysis & API Research
- [x] Research current Habitica API requirements
- [x] Identify breaking changes in API (X-Client header required)
- [x] Analyze current API usage patterns
- [x] Document required updates

### Phase 2: Type System Enhancement ✅ COMPLETED
- [x] Expand habitica/types.ts with comprehensive interfaces
- [x] Add proper error type definitions
- [x] Create API response type definitions
- [x] Add validation schemas
- [x] **NEW: Import proper Obsidian types** (App, Plugin, TFile, etc.)
- [x] **NEW: Replace 'any' types with specific Obsidian interfaces**
- [x] **Created modular type system**: tasks.ts, user.ts, responses.ts, obsidian.ts
- [x] **Enhanced error handling**: HabsiadApiError, HabsiadPluginError classes
- [x] **Updated habiticaService**: Proper type annotations and error handling

### Phase 3: Habitica Service Refactor
- [x] Update authentication methods (added X-Client header)
- [x] Add missing API endpoints (added getTodos method)
- [x] Implement proper error handling (rate limiting, 429 responses)
- [x] Add rate limiting and retry logic (30-second interval)
- [x] Update request/response handling

### Phase 4: Main Plugin Modularization ✅ 72.4% COMPLETE! + Compliance Fixes ✅
- [x] Extract RetroTagger into separate module (566 lines → modals/retroTagger.ts)
- [x] Split command handlers into separate files (commands/habiticaSync.ts, frontmatterUpdates.ts)
- [x] Create dedicated modal management (IHabsiadPlugin interface for clean dependencies)
- [x] Extract utility commands (utilityCommands.ts - replaceWeekday, syncTodo, syncBasicHabiticaStats)
- [x] Extract calorie calculations (calorieCalculations.ts - EST.CALORIES table parsing)
- [x] **ACHIEVED: 1572 → 434 lines (1138 lines removed, 72.4% reduction!)**
- [x] **Fix critical Obsidian compliance issues**: configDir, onunload antipattern, default hotkeys
- [x] **A/B testing setup**: Dual plugin build system for performance comparison
- [x] **MAJOR COMPLIANCE FIXES COMPLETED**:
  - [x] **innerHTML security**: Replaced all innerHTML usage with proper DOM API
  - [x] **CSS migration**: Moved all inline styles to CSS classes in styles.css
  - [x] **Console.log cleanup**: Removed debug logging, added proper error handling
  - [x] **RetroTagger bug fix**: Fixed section insertion ordering for Achievements/Dailies
- [ ] Extract syncHabiticaToFrontmatter method (glossary-based frontmatter sync, ~150 lines)
- [ ] **Add comprehensive error handling with user-friendly Notice messages**

### Phase 5: Obsidian Compliance
- [ ] **Audit and fix direct DOM access** (document.createElement → createEl)
- [ ] **Implement proper event registration** (registerDomEvent, registerInterval)
- [ ] **Add TypeScript strict mode compliance**
- [ ] **Performance optimization** (app.vault.cachedRead usage)
- [ ] **Resource cleanup verification** (Component lifecycle)

### Phase 6: Testing & Validation
- [ ] Test API connectivity with new patterns
- [ ] Validate backward compatibility
- [ ] Performance testing
- [ ] Error scenario testing

## 📁 Proposed New Structure

```
src/
├── main.ts (reduced size)
├── settings.ts
├── habitica/
│   ├── api/
│   │   ├── client.ts - HTTP client with retry logic
│   │   ├── auth.ts - Authentication handling
│   │   ├── endpoints.ts - API endpoint definitions
│   │   └── validation.ts - Response validation
│   ├── types/
│   │   ├── user.ts - User data interfaces
│   │   ├── tasks.ts - Task-related types
│   │   ├── party.ts - Party/group types
│   │   └── responses.ts - API response types
│   └── habiticaService.ts (enhanced)
├── modals/
│   ├── retroTagger.ts
│   └── baseModal.ts
├── commands/
│   ├── habitSync.ts
│   ├── todoSync.ts
│   └── weekdayReplace.ts
├── utils/
│   ├── settingsSync.ts
│   ├── dateUtils.ts
│   └── errorHandler.ts
└── views/ (existing structure)
```

## 🚦 Safety Measures

1. **Branch isolation**: All changes in refactor-v2 branch
2. **Incremental commits**: Small, focused commits with clear messages
3. **Backward compatibility**: Maintain existing settings and data
4. **Rollback ready**: Can always revert to main branch
5. **Testing**: Validate each phase before proceeding

## 📝 Next Steps

1. Research current Habitica API documentation
2. Identify specific API changes needed
3. Start with type definitions (safest first step)
4. Update Habitica service incrementally
5. Test each component before proceeding

---

**Status**: ⏳ Planning Phase
**Branch**: refactor-v2  
**Starting Point**: main@823ccd8
