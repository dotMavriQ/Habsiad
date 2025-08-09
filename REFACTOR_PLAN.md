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

### Phase 2: Type System Enhancement
- [ ] Expand habitica/types.ts with comprehensive interfaces
- [ ] Add proper error type definitions
- [ ] Create API response type definitions
- [ ] Add validation schemas

### Phase 3: Habitica Service Refactor
- [x] Update authentication methods (added X-Client header)
- [x] Add missing API endpoints (added getTodos method)
- [x] Implement proper error handling (rate limiting, 429 responses)
- [x] Add rate limiting and retry logic (30-second interval)
- [x] Update request/response handling

### Phase 4: Main Plugin Modularization
- [ ] Extract RetroTagger into separate module
- [ ] Split command handlers into separate files
- [ ] Create dedicated modal management
- [ ] Organize utility functions

### Phase 5: Testing & Validation
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
