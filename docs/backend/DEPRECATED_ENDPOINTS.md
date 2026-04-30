# Deprecated API Endpoints

This document tracks deprecated API endpoints and their migration status.

## Feature Flag Endpoints

### Legacy Endpoint: `/feature-flag/tenant`
- **Status**: Deprecated
- **Replacement**: `/feature-flags/tenant` (plural)
- **Deprecated Date**: April 2026
- **Frontend Fallback**: Temporary fallback exists in `src/api/feature-flag.ts`
  - Primary endpoint `/feature-flags/tenant` is attempted first
  - If primary fails, falls back to `/feature-flag/tenant` for migration compatibility
  - Fallback logs a warning in development mode only
  - **TODO**: Remove fallback after staging verification

### Migration Notes
- The frontend tenant CRM has a temporary fallback mechanism to support graceful migration
- This fallback is intended as a short-term bridge during the endpoint migration
- Development-mode warnings alert developers when the fallback is triggered
- Production users are not exposed to these warnings

### Removal Checklist
- [ ] Verify staging environment uses new endpoint `/feature-flags/tenant`
- [ ] Remove fallback logic from `src/api/feature-flag.ts`
- [ ] Remove legacy endpoint from backend API
- [ ] Update this document upon completion
