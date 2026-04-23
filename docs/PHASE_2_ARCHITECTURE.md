# Phase 2: Frontend Architecture Strategy

## Goal
Make CRM able to function without LMS. CRM entities must stop carrying LMS assumptions directly.

## Current State Analysis

### Lead Model
- Currently has: `interestedCourseId`, `interestedGroupId` (LMS-specific)
- Added: `productInterest` (generic, backward compatible)
- Status: Partially prepared, needs form updates and API coordination

### Contact Model
- Currently has: `lmsStudentId`, `externalStudentId` (LMS-specific)
- Status: Fully coupled to LMS, needs decoupling

### Deal Model
- Currently has: `lmsCourseId`, `lmsGroupId`, `courseType`, `courseNameSnapshot`, `groupNameSnapshot` (LMS-specific)
- Status: Fully coupled to LMS, needs decoupling

## Target Architecture

### Core CRM Entities (Clean)
- Lead: Only CRM fields (name, phone, email, status, etc.) + generic `productInterest`
- Contact: Only CRM fields (name, phone, email, etc.) - no LMS student IDs
- Deal: Only CRM fields (amount, currency, stage, etc.) - no LMS course/group data

### LMS Bridge Layer (Optional)
- `LeadCourseInterest.tsx`: Component for LMS-specific course/group interest (admin only)
- `ContactStudentMapping.tsx`: Component for LMS student identity mapping (admin only)
- `DealCourseMapping.tsx`: Component for LMS course/group mapping (admin only)

### Type System Strategy
1. Keep old LMS fields in interfaces for backward compatibility during migration
2. Mark as deprecated with JSDoc comments
3. Create new clean interfaces for Phase 3 (Bridge Module)
4. Use conditional rendering based on feature flags or permissions

## Implementation Strategy

### Phase 2.1: Prepare Frontend (Can start now)
1. Create bridge component structure
2. Add deprecation comments to LMS fields in types
3. Create feature flag for LMS bridge enablement
4. Prepare conditional rendering logic

### Phase 2.2: Backend Coordination (Requires backend team)
1. Backend adds new generic fields to entities
2. Backend migrates existing data
3. Backend API updates to support both old and new fields
4. Backend deprecates old LMS fields

### Phase 2.3: Frontend Migration (After backend ready)
1. Switch to new fields in forms
2. Remove old fields from type definitions
3. Update all API calls
4. Remove old LMS columns from tables

## Risk Mitigation

### Risk: Breaking changes during migration
**Mitigation:** Keep old fields during migration, use dual-write strategy

### Risk: Data loss during migration
**Mitigation:** Backend must run migration script before frontend switches

### Risk: UI regression for admin users
**Mitigation:** Bridge components maintain same functionality, just moved to different location

## Success Criteria
- CRM entities work without LMS data
- LMS-specific data accessible via bridge components (admin only)
- No data loss during migration
- No functional regression for any role
