# Phase 2 Migration Strategy

## Overview
This document outlines the migration strategy for removing LMS fields from core CRM entities and moving them to the LMS bridge layer.

## Migration Phases

### Phase 2.1: Frontend Preparation (Current Phase)
**Status:** In Progress

**Objective:** Prepare frontend architecture for decoupling without requiring backend changes.

**Completed:**
- ✅ Created LMS bridge component structure
- ✅ Added @deprecated comments to LMS fields in type definitions
- ✅ Created bridge components: LeadCourseInterest, ContactStudentMapping, DealCourseMapping

**In Progress:**
- 🔄 Create migration strategy document
- ⏳ Integrate bridge components into existing pages
- ⏳ Add feature flag for LMS bridge enablement

**Backend Dependencies:** None

**Risk:** Low - No breaking changes, only preparation work

---

### Phase 2.2: Backend Preparation
**Status:** Not Started - Requires Backend Team

**Objective:** Prepare backend to support both old and new field structures.

**Tasks:**
1. Add new generic fields to entities:
   - Lead: Keep `productInterest` field (already exists)
   - Contact: Add optional LMS mapping table
   - Deal: Add optional LMS mapping table

2. Create migration scripts:
   - Migrate `interestedCourseId`/`interestedGroupId` to `productInterest` (if applicable)
   - Migrate `lmsStudentId`/`externalStudentId` to LMS mapping table
   - Migrate LMS deal fields to LMS mapping table

3. Update API endpoints:
   - Support both old and new field structures during transition
   - Add deprecation warnings for old fields

**Backend Dependencies:** Requires database schema changes

**Risk:** Medium - Database migrations need careful testing

---

### Phase 2.3: Frontend Migration
**Status:** Blocked - Waiting for Phase 2.2

**Objective:** Switch frontend to use new field structure and bridge components.

**Tasks:**
1. Update Lead forms to use `productInterest` instead of course/group selectors
2. Integrate `LeadCourseInterest` bridge component into LeadDetail
3. Integrate `ContactStudentMapping` bridge component into ContactDetail
4. Integrate `DealCourseMapping` bridge component into DealDetail
5. Remove old LMS fields from table columns
6. Update API calls to use new field structure

**Backend Dependencies:** Phase 2.2 must be complete

**Risk:** Medium - Requires coordination with backend deployment

---

### Phase 2.4: Cleanup
**Status:** Blocked - Waiting for Phase 2.3

**Objective:** Remove deprecated fields and complete migration.

**Tasks:**
1. Remove @deprecated fields from type definitions
2. Remove old field references from all components
3. Update documentation
4. Remove feature flags

**Backend Dependencies:** Phase 2.3 must be complete and stable

**Risk:** Low - Final cleanup after successful migration

---

## Rollback Strategy

### If Phase 2.2 Fails
- Frontend remains in Phase 2.1 state (no breaking changes)
- @deprecated comments can be removed if needed
- Bridge components can be disabled via feature flag

### If Phase 2.3 Fails
- Revert frontend to Phase 2.1 state
- Backend can keep both old and new field structures
- No data loss (old fields still exist)

### If Phase 2.4 Fails
- Keep @deprecated fields for one additional release cycle
- Monitor for any issues
- Complete cleanup in next release

---

## Testing Strategy

### Phase 2.1 Testing
- ✅ Verify bridge components render correctly
- ✅ Verify @deprecated comments don't break TypeScript compilation
- ⏳ Verify existing functionality still works (no regression)

### Phase 2.2 Testing (Backend)
- Test migration scripts on staging database
- Verify API endpoints support both old and new fields
- Test data integrity after migration

### Phase 2.3 Testing
- Test all CRUD operations with new field structure
- Test bridge components with real data
- Verify permission checks work correctly
- Test mobile and desktop views

### Phase 2.4 Testing
- Full regression testing
- Verify all LMS functionality still works via bridge components
- Verify CRM works without LMS data

---

## Success Criteria

### Phase 2.1
- Bridge components created and tested
- Type system prepared with deprecation comments
- No breaking changes to existing functionality

### Phase 2.2
- Backend migration scripts tested and verified
- API endpoints support both old and new fields
- No data loss during migration

### Phase 2.3
- Frontend uses new field structure
- Bridge components integrated into all relevant pages
- Old LMS fields removed from UI
- No functional regression

### Phase 2.4
- All deprecated fields removed from codebase
- Documentation updated
- Clean separation between CRM and LMS achieved

---

## Timeline Estimate

- Phase 2.1: 1-2 days (frontend preparation)
- Phase 2.2: 3-5 days (backend preparation and migration)
- Phase 2.3: 2-3 days (frontend migration)
- Phase 2.4: 1 day (cleanup and testing)

**Total:** 7-11 days
