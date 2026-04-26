# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Version bumps are classified by delivery scale; see `VERSIONING.md`.

## [1.7.1] - 2026-04-25

### Added
- CRM/LMS separation planning docs for frontend, backend, and platform decomposition
- Role permission hook for centralized CRM, LMS, admin, and retention visibility checks
- Workflow docs for sales, assistant, and manager daily operations
- LMS bridge enablement mechanism using React Context with `LmsBridgeProvider` and `useLmsBridge` hook
- Phase 4 feature flag system: `FeatureFlagProvider` with `useFeatureFlags` hook for module-level feature control
- Phase 4 feature flag types: `FeatureFlag` type and `FeatureFlags` interface with _enabled suffix (crm_enabled, lms_bridge_enabled, trial_lessons_enabled, retention_enabled, telegram_notifications_enabled, advanced_reports_enabled)
- Sync metadata fields to bridge types: `syncStatus` and `lastSyncedAt` to `LeadWithCourseInterest`, `ContactWithStudentMapping`, `DealWithCourseMapping`, and `DealPaymentSummaryWithBridge`
- Enrollment sync fields to `PaymentWithEnrollment`: `enrollmentRequestId`, `syncError`, `syncMetadata`
- Bridge type imports to API modules: `ContactWithStudentMapping`, `LeadWithCourseInterest`, `DealWithCourseMapping`, `PaymentWithEnrollment`
- Status API methods to tenant-config client: `getStatuses`, `createStatus`, `updateStatus`, `deleteStatus`
- `TenantStatusResponse` interface for status API responses
- `StatusConfig` interface to types for status configuration
- `leadStatuses` and `dealStatuses` to `TenantConfig` type
- Status loading in `TenantConfigProvider` on mount
- `leadStatusOptions` in Leads.tsx using tenant config with fallback to hardcoded i18n data
- `leadStatusOptions` in LeadDetail.tsx using tenant config with fallback to hardcoded i18n data
- `pipelineStageOptions` in Deals.tsx using tenant config with fallback to hardcoded i18n data
- Phase 4 environment variables: VITE_ENABLE_CRM, VITE_ENABLE_TRIAL_LESSONS, VITE_ENABLE_RETENTION, VITE_ENABLE_TELEGRAM, VITE_ENABLE_ADVANCED_REPORTS
- Phase 4 tenant configuration system: `TenantConfigProvider` with `useTenantConfig` hook for tenant-specific settings
- Phase 4 tenant configuration types: `TenantConfig`, `BrandingConfig`, `NotificationChannel`, `PipelineStageConfig`, `RoleConfig`, `TenantLeadSource` interfaces
- Phase 4 Settings UI: tenant configuration section with currency, timezone, and language selectors
- Phase 4 Settings UI: branding configuration section with company name and primary color picker
- Phase 4 Settings UI: lead sources display section showing configured lead sources with names
- Phase 4 Settings UI: payment methods display section showing configured payment methods
- Phase 4 Settings UI: feature flags section with toggle switches for all feature flags
- Phase 4 API client: `tenantConfigApi` for tenant configuration endpoints (config, roles, stages, lead sources, notification channels)
- Phase 4 API client: `featureFlagApi` for feature flag endpoints (tenant flags, global flags)
- Phase 4 backend integration: `FeatureFlagProvider` now loads flags from backend API on mount
- Phase 4 backend integration: `TenantConfigProvider` now loads config from backend API on mount
- Phase 4 backend integration: tenant config updates are persisted to backend API
- Phase 4 backend: `FeatureFlagController` with GET/POST /tenant and GET/PUT /global endpoints
- Phase 4 backend: `FeatureFlagService.getAllGlobalFlags()` method for retrieving all global flags
- Phase 4 backend: Fixed `TenantConfig` entity column mappings (company_name, logo_url, primary_color)
- Phase 4 backend: Fixed status filter contract in `TenantConfigController` (changed @Param to @Query)
- Phase 4 documentation: Phase 4 contract document defining tenant context, flag precedence, API contracts
- Phase 4 documentation: Phase 4 audit document identifying backend and frontend issues
- Phase 4 documentation: Phase 4 completion gates document defining acceptance criteria
- App.tsx: Integrated `FeatureFlagProvider` and `TenantConfigProvider` into the provider hierarchy
- App.tsx: `LmsBridgeProvider` now receives `enableLmsBridge` from feature flags instead of hardcoded value
- AppSidebar.tsx: Navigation items now filtered by feature flags (courses, enrollments, trial-lessons, retention, reports)
- AppSidebar.tsx: Added `useFeatureFlags` hook to check feature enablement before rendering navigation items
- Settings.tsx: Added feature flag toggle switches for all feature flags with backend persistence
- Settings.tsx: Added tenant configuration UI for currency, timezone, language, company name, and primary color
- Settings.tsx: Added lead sources and payment methods display sections from tenant config
- Settings.tsx: Integrated `useFeatureFlags` and `useTenantConfig` hooks for managing settings
- types/index.ts: Added `FeatureFlag` type and `FeatureFlags` interface for feature flag system
- types/index.ts: Added `TenantConfig`, `BrandingConfig`, `NotificationChannel`, `PipelineStageConfig`, `RoleConfig`, `TenantLeadSource` interfaces
- Bridge data presence requirement to ContactDetail.tsx integration history panel (requires bridgeData.lmsStudentId)
- Bridge data presence requirement to DealDetail.tsx integration history panel (requires contactBridgeData.lmsStudentId)
- types/index.ts: Added LMS bridge field documentation comments to Lead, Contact, Deal, and Payment types
- src/api/feature-flag.ts: New API client for feature flag management (getTenantFlags, setTenantFlag, getGlobalFlags, setGlobalFlag)
- src/api/tenant-config.ts: New API client for tenant configuration (config, roles, stages, lead sources, notification channels)
- src/components/core/FeatureFlagProvider.tsx: New provider for feature flag context with backend integration
- src/components/core/TenantConfigProvider.tsx: New provider for tenant configuration context with backend integration
- src/api/tenant-config.ts: New API client for tenant configuration with full CRUD for config, lead sources, roles, pipeline stages, statuses, notification channels, and payment methods, with x-company-id header support
- src/lib/jwt.ts: New JWT utility with decodeJwt and isTokenExpired functions, tenantId in JwtPayload interface
- src/lib/i18n.ts: Added educationLeadStatus and educationDealStatus for LMS bridge-specific statuses
- src/pages/Settings.tsx: Added comprehensive tenant configuration UI with currency, timezone, language, company name, and primary color selectors, feature flag toggle switches with backend persistence, lead sources and payment methods display sections
- src/pages/Leads.tsx: Added tenant-configured lead sources and lead statuses with fallback to hardcoded i18n data
- src/pages/LeadDetail.tsx: Added tenant-configured lead sources and lead statuses with fallback to hardcoded i18n data
- src/pages/Pipeline.tsx: Added tenant-configured pipeline stages with fallback to hardcoded stages, currency formatting using tenantConfig.currency
- src/pages/Payments.tsx: Added currency formatting using tenantConfig.currency
- PHASE_1_4_FINAL_COMPLETION_PLAN.md: Comprehensive completion plan for Phases 1-4 with blockers, exit criteria, and progress tracking
- FINAL_RECONCILED_BLOCKER_VERDICT.md: Reconciled audit verdict comparing two completion audits with final must-fix list
- PHASE_1_4_COMPLETION_BACKLOG.md: Task backlog for remaining Phase 1-4 completion work
- CURRENT_STATE_IMPLEMENTATION_REPORT_CODEX.md: Current state implementation report documenting platformization progress

### Changed
- Phase 2.3 CRM-LMS decoupling: bridge components (LeadCourseInterest, ContactStudentMapping, DealCourseMapping) now check LMS bridge flag in addition to permissions
- Phase 2.3 CRM-LMS decoupling: removed unused LMS course/group hooks from Leads.tsx
- Phase 2.3 CRM-LMS decoupling: LMS enrollment buttons in Leads and Deals tables now conditional on LMS bridge flag
- Phase 2.3 CRM-LMS decoupling: removed LMS field IDs from enrollment navigation params (courseId, groupId, studentId)
- Phase 2.4 CRM-LMS decoupling: removed @deprecated annotations from type definitions, replaced with clear documentation that these are LMS bridge fields
- LMS bridge enablement is now controlled by `VITE_ENABLE_LMS_BRIDGE` instead of a hardcoded app-level flag
- Deal creation no longer sends contact IDs as fake `leadId` values
- Phase 4 modularization: navigation items now filtered by feature flags in addition to permissions
- Phase 4 modularization: courses, enrollments, trial-lessons, retention, and reports pages now respect feature flags
- Phase 4 modularization: Settings page now displays current feature flag status (read-only, controlled by environment variables)
- Bridge types documentation: Updated to reflect that types represent bridge-only enrichment payloads from dedicated bridge endpoints, not extensions of CRM types
- Bridge types structure: Removed inheritance from CRM types (`Lead`, `Contact`, `Deal`, `Payment`) to align with explicit bridge boundary model
- Bridge API client methods: Updated to use formal bridge types instead of inline type definitions
- `bridgeApi.getContactBridgeData`: Now returns `ContactWithStudentMapping` type
- `bridgeApi.getLeadBridgeData`: Now returns `LeadWithCourseInterest` type
- `bridgeApi.getDealBridgeData`: Now returns `DealWithCourseMapping` type
- `bridgeApi.updateDealLmsMapping`: Now returns `DealWithCourseMapping` type
- `bridgeApi.getPaymentBridgeData`: Now returns `PaymentWithEnrollment` type
- Leads.tsx: Status dropdown now uses tenant-configured statuses instead of hardcoded i18n data
- LeadDetail.tsx: Status dropdown now uses tenant-configured statuses instead of hardcoded i18n data
- Deals.tsx: Pipeline stage dropdown now uses tenant-configured stages instead of hardcoded i18n data
- Deals.tsx: Mobile board columns now use tenant-configured pipeline stages
- Reports.tsx: Currency formatting now uses `tenantConfig.currency` instead of hardcoded "сом"
- Deals.tsx: Currency formatting now uses `tenantConfig.currency` instead of hardcoded "сом"
- Pipeline.tsx: Currency formatting now uses `tenantConfig.currency` instead of hardcoded "сом"
- Payments.tsx: Currency formatting now uses `tenantConfig.currency` instead of hardcoded "сом"

### Removed
- docs/PHASE_2_ARCHITECTURE.md: Superseded by PHASE_1_4_FINAL_COMPLETION_PLAN.md
- docs/PHASE_2_MIGRATION.md: Superseded by PHASE_1_4_FINAL_COMPLETION_PLAN.md

### Fixed
- Dashboard now uses split `getCrmStats` and `getEducationStats` endpoints instead of legacy combined `getStats`, properly decoupling CRM from LMS data
- Reports page now uses the original `reportsApi.getStats` endpoint instead of dashboard endpoints to preserve report-specific backend behavior
- Reports course filter now ignores URL params when LMS bridge is disabled, preventing hidden filters from bookmarked URLs
- Reports CSV export now conditionally includes LMS-only data (trial conversion, course rows) based on LMS bridge flag
- Reports trial conversion KPI card is hidden when LMS bridge is disabled
- LMS bridge is now truly optional - CRM UI keeps working with empty LMS stats when education endpoint fails, instead of failing the entire page
- Bridge type synchronization: Frontend bridge types now include all sync metadata fields present in backend DTOs, eliminating need for inline type workarounds in components
- LMS-only fields, IDs, history panels, and enrollment actions are now hidden from non-admin roles across list and detail views
- Tenant-config endpoint route shadowing: Moved `/statuses`, `/sources`, and `/pipeline-stages` routes before `/:id` routes in lead and deal controllers (backend)
- Bridge API security: Added role-based access control to all bridge endpoints, restricting access to MANAGER, ADMIN, and SUPERADMIN roles (backend)
- Manager lead assignment flow no longer regresses after permission centralization
- Legacy migration navigation is again restricted to superadmin only
- Deal enrollment navigation now points to the reachable `/enrollments` route
- Payment warnings and deal labels no longer expose LMS-only context to unauthorized roles
- ContactDetail.tsx now uses canViewStudentSummary() instead of canViewLmsTechnicalFields() for student summary, allowing managers to see student summary data as intended
- DealCourseMapping.tsx enrollment navigation now uses crmDealId query param instead of dealId, matching EnrollmentForm expectations
- EnrollmentsPage now seeds initialHistoryFilters with crmDealId for deal context, enabling proper prefiltering from deal detail "Толук тарых" navigation
- Removed references to setManagersLoading in Leads.tsx (removed with LMS hooks)
- LMS integration history panels now only render when bridge data is present, preventing empty UI sections in CRM-only mode
- Removed references to courses variable in Leads.tsx (removed with LMS hooks)
- FeatureFlagProvider now uses conservative defaults (trial_lessons_enabled, telegram_notifications_enabled, advanced_reports_enabled default to false)
- FeatureFlagProvider environment variable override logic now only applies when explicitly set (using conditional spread instead of direct assignment)
- IntegrationHistoryPanel now correctly accesses `data?.data` instead of `data?.items` for integration history items
- LmsIntegrationHistoryResponse interface changed `items` property to `data` to match actual API response structure
- RetentionCase interface now includes LMS fields (lmsStudentId, lmsEnrollmentId, lmsCourseId, lmsGroupId) extracted from metrics by backend
- Frontend retention API contract no longer leaks LMS fields (lmsCourseId, lmsGroupId) for CRM-only mode
- Dashboard backend now zeroes retention stats when LMS bridge is off (openRetentionCases conditional on lms_bridge_enabled)
- Dashboard page conditionalized the retention priority item/stat based on isLmsBridgeEnabled flag
- Reports page retention stat card now conditional on isLmsBridgeEnabled flag
- Reports page retention tab trigger now conditional on isLmsBridgeEnabled flag
- Reports page retention tab content now conditional on isLmsBridgeEnabled flag
- Payment config authority improved: DTO method is now string, entity method is now string, runtime validates against tenant config
- Feature flags and tenant config loading: Fixed JSON parse errors by making providers only load data when user is authenticated
- React context error: Fixed "useAuth must be used within AuthProvider" error in AppContent by adding proper useAuth hook usage
- API client header injection: Removed localStorage dependency from tenant-config and feature-flag API clients, now using automatic X-Company-Id header from AuthContext
- Tenant config type fixes: Fixed type mismatches in TenantConfigProvider for mapped data structures (leadSources, pipelineStages, statuses, paymentMethods)

## [1.7.0] - 2026-04-24

### Added
- **Login page redesign** with split-screen layout
  - Left side displays EduPro CRM branding with gradient background
  - Right side contains the login form
  - Added support contact information (email, phone) on login screen
  - Added help button for user assistance
  - Responsive design hides branding on mobile screens
- **Dashboard priority cards** showing actionable items
  - New leads requiring attention
  - Pending payments awaiting confirmation
  - Open retention cases needing follow-up
  - Recently won deals for celebration
  - Each card includes count, description, and navigation action
- **Dashboard stats badges** displaying key metrics
  - Total lead count
  - Overall conversion rate
  - Top performing manager
  - Top performing course
- **Deals page pipeline stage quick actions**
  - Inline Select dropdown for changing deal pipeline stages
  - Context-aware quick action suggestions based on current stage
  - Loading state during stage updates
  - Toast notifications on successful stage changes
- **Deals page mobile board columns** with swipeable pipeline stages
  - Horizontal scrolling columns for each pipeline stage
  - Mobile card rendering for deal information
  - Stage count badges on column headers
- **AppLayout breadcrumbs** showing navigation path
  - Dynamic breadcrumb generation based on current route
  - Localized labels for all navigation items
  - ID-based routes show contextual labels (e.g., "Лид маалыматы")
  - BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator components
- **AppLayout quick create functionality**
  - Context-aware create button that routes to appropriate create form
  - Supports leads, contacts, deals, and tasks
  - Default fallback to leads create form
- **DataTable mobile board support**
  - New `mobileBoardColumns` prop for defining board columns
  - New `getMobileBoardColumnId` prop for grouping items into columns
  - New `mobileBoardEmptyMessage` prop for empty column states
  - Snap scrolling for mobile board columns
  - Flattened column headers with muted background
  - Tighter card spacing for better content density
- **DataTable row selection** with checkbox support
  - New `enableRowSelection` prop for enabling selection
  - New `selectedIds` prop for controlled selection state
  - New `onSelectionChange` prop for selection callbacks
  - Select all checkbox in table header
  - Individual row checkboxes with proper state management
- **DataTable active filters** display
  - New `activeFilters` prop for filter chip rendering
  - Removable Badge components with X buttons
  - Aria labels for accessibility
- **DataTable sticky header** support
  - New `stickyHeader` prop for fixed table headers on scroll
  - Sticky header stays visible during vertical scrolling
- **DataTable error and retry** handling
  - New `errorMessage` prop for custom error messages
  - New `onRetry` prop for retry action callbacks
  - StatePanel component for consistent error/loading/empty states
- **PageShell StatePanel component** for consistent state display
  - Unified loading, error, and empty state rendering
  - Optional icon display
  - Compact mode for smaller footprints
  - Action button with custom labels
  - Consistent styling across all pages
- **DateRangeFilter component** for reusable date filtering
  - Preset options: all, today, week, month, custom
  - Conditional custom date range inputs
  - Optional clear custom callback
  - Localized labels via i18n
- **Kyrgyz translations** expanded
  - Added `enrollments` navigation label
  - Added `legacyData` navigation label
  - Added common placeholders (fullNamePlaceholder, emailPlaceholder, notesPlaceholder)
  - Added contact-related keys (infoTitle, editTitle, lmsId, noLmsId, externalId, lmsInfoTitle, newLmsLink, lmsEnrollment)

### Changed
- **Login page** completely redesigned with modern split-screen layout
- **Dashboard page** enhanced with priority cards and stats badges
- **Deals page** now supports pipeline stage updates directly from the list
- **AppLayout** now displays breadcrumbs for navigation context
- **DataTable** significantly enhanced with mobile board support, row selection, active filters, and sticky headers
- **PageShell** refactored with new StatePanel component for consistent state rendering
- **Mobile Leads page** redesigned with grouped filter section
  - Search bar moved above filters for better mobile priority
  - Status and date dropdowns in horizontal row to save vertical space
  - Custom date fields only appear when "Өзүңүз тандаңыз" is selected
  - Active filters display as removable Badge chips
  - Clear all filters button as icon-only action
  - Page header description hidden on mobile
  - ~40% reduction in scroll-to-content distance
- **Mobile lead cards** compacted with improved hierarchy
  - Phone as tappable `tel:` link for direct dialing
  - Email as `mailto:` link (hidden on small screens)
  - Course tag in header row
  - Tags inline with assigned manager
  - Delete moved to end of action row
  - Unified action row with quick actions, LMS, delete

### Fixed
- Active filter chip for custom date range now shows "Күн: өзүңүз тандаңыз" when dates are empty

## [1.6.0] - 2026-04-23

### Added
- New lead qualification status `no_response` (Жооп жок) for leads that have not been responded to
- Date range filtering to Leads page with preset options (today, week, month) and custom date range picker
- Date range filtering to Dashboard page with preset options (today, week, month) and custom date range picker
- Refresh button to Dashboard page with loading spinner
- Error handling to Dashboard page with toast notifications and error card UI
- Data freshness indicator to Dashboard page showing when data was last updated
- Conversion rate line chart overlay to manager performance chart on Dashboard
- Kyrgyz translations for date range filters (Баары, Бүгүн, Бул жума, Бул ай, Өзүңүз тандаңыз, Башталган күн, Аяктаган күн)

### Changed
- Lead qualification status type now includes 'no_response' option
- Status badge component now displays warning variant for 'no_response' status
- CRM status mapping now handles 'no_response' status by mapping to legacy 'new' status
- Dashboard now uses date range parameters (from/to) when fetching stats


## [1.5.0] - 2026-04-01

### Added
- Admin notification system with approval workflow
  - New "Бекитүү күтүү" (Pending Approvals) tab in Notifications page for admin users
  - Visual distinction for approval notifications with amber styling and icons
  - Payment approval notifications display with CreditCard icon
  - Enrollment approval notifications display with GraduationCap icon
  - Notification count badges on tabs showing total vs approval counts
- New "Төлөмдөр" (Payments) analytics tab on Reports page with comprehensive payment metrics
- Revenue trend line chart showing daily payment amounts over time
- Payment status distribution pie chart (confirmed/submitted/failed)
- Payment methods bar chart with count and amount breakdowns
- Revenue by course horizontal bar chart showing top performing courses
- Manager performance table with payment counts and revenue totals
- New API methods: `reportsApi.getPaymentReports()` and `reportsApi.getRevenueReports()`
- Payment summary stat cards showing total payments, total amount, confirmed count, and pending count

## [1.4.4] - 2026-04-01

### Fixed
- Enrollment history status filter now uses correct API enum values (`activated`, `pending_approval`, `failed`) instead of invalid values (`success`, `pending`, `error`)
- `getFriendlyError` now properly handles API error messages that are arrays instead of strings, preventing "trim is not a function" runtime errors
- Error messages from backend validation failures now display correctly in UI notifications

## [1.4.3] - 2026-03-31

### Fixed
- Admin LMS approval queue now shows already-approved direct enrollments that still need activation instead of hiding them from the Enrollments page
- Enrollments page approval actions now adapt their labels for already-approved rows, making stalled activations explicit
- Contact and LMS navigation flows recover more reliably once backend enrollment records already contain an LMS student mapping

## [1.4.2] - 2026-03-31

### Added
- Admin recovery action on the LMS enrollment form for recreating placeholder-email LMS accounts with the real CRM contact email

### Fixed
- Managed enrollment flow can now request placeholder-account recreation instead of only returning the existing enrollment when LMS email is stuck on `@placeholder.local`
- Frontend enrollment API and hooks now support the placeholder-account recovery flag
- Admins can immediately generate a fresh onboarding link after recreating a placeholder LMS account

## [1.4.1] - 2026-03-31

### Added
- Deal detail now includes an LMS edit dialog for correcting the sold LMS course/group directly on the deal before payment confirmation

### Fixed
- Payment confirmation now blocks more clearly when an offline or online-live deal is missing its LMS group and routes the operator to the deal that needs correction
- Payment-related frontend typings now include `deal.lmsGroupId`, matching the actual data used by the confirmation guard
- Deal-side LMS edit flow now fills the workflow gap where payment confirmation depended on deal LMS data but the UI had no way to update it

## [1.4.0] - 2026-03-31

### Added
- Canonical LMS enrollment hooks and API client coverage for:
  - `POST /api/enrollments`
  - `GET /api/enrollments/pending`
  - `GET /api/enrollments/history`
  - `POST /api/enrollments/:id/approve`
- Admin enrollment regression specs for:
  - pending approval
  - immediate activation
  - onboarding-link generation after auto-activation
- LMS shortcuts from lead, deal, and contact list pages into the canonical Enrollments page
- Inline history detail dialog on the Enrollments page for admin review

### Changed
- The Enrollments page is now the single CRM workflow for manual LMS requests and admin approval
- Enrollment approval/history UI now uses the canonical backend enrollment API instead of lead-shaped compatibility routes
- LMS enrollment form now blocks requests until the selected lead is converted to a contact or a contact-linked deal is selected
- Frontend build now uses basic manual chunk splitting for React, Radix, and TanStack Query

### Fixed
- Admin approval UI on the Enrollments page is now wired into the reachable `/enrollments` workspace instead of a disconnected screen
- LMS course/group resolution in the managed enrollment flow now uses the selected enrollment context consistently
- Enrollment form submission no longer relies on duplicated lead-level enrollment UI
- Enrollment tests no longer emit React Router future-flag noise during normal runs

## [1.3.1] - 2026-03-29

### Fixed
- Sales users no longer call assignable-user endpoints on lead pages where assignment is not editable for their role
- Payment confirmation dialogs now resolve the student name safely instead of showing `undefined`
- Contact detail LMS action buttons now wrap correctly on narrower layouts
- LMS enrollment screens now warn when the student already appears to be enrolled in the selected course/group

## [1.3.0] - 2026-03-29

### Changed
- LMS enrollment forms now prefill student identity data more reliably from the selected CRM lead, deal, and contact context
- Payment and LMS enrollment screens now explain LMS email requirements and onboarding state directly in the interface
- Contact detail and LMS student summary panels now keep generated onboarding links visible with dedicated copy buttons

## [1.2.3] - 2026-03-29

### Fixed
- Modal forms now reset correctly when closed via `Cancel`, the header `X` button, or backdrop click
- Lead, contact, legacy contact, schedule, payment, task, trial lesson, and user create/edit dialogs no longer keep stale unsaved input after close
- Lead create dialog duplicate-check state now also clears on close, so old duplicate warnings do not remain when reopening the modal

### Notes
- This is a frontend-only patch release on top of `1.2.2`

## [1.2.2] - 2026-03-28

### Changed
- CRM pages now show empty states instead of fabricated sample records when backend requests fail
- Dashboard, reports, and pipeline views now fall back to empty datasets instead of mock metrics

### Removed
- All frontend mock data fallbacks across leads, contacts, deals, tasks, trial lessons, users, retention, dashboard, reports, pipeline, and legacy pages

### Fixed
- Legacy contact list and detail typings now support legacy source values without conflicting with CRM `ContactSource`
- Legacy contact import action now accepts the correct legacy row shape for type-safe lead import

### Notes
- This is a frontend-only patch release on top of `1.2.1`

## [1.2.1] - 2026-03-28

### Changed
- Table pagination now shows clickable page numbers for lead and legacy data lists
- Mobile pagination for lead and legacy data views now also shows page numbers for faster navigation

### Fixed
- Lead search no longer crashes when backend records contain `null` values in searchable text fields
- Legacy data table now shows the record creation date in both desktop and mobile views

### Notes
- This is a frontend-only patch release on top of `1.2.0`

## [1.2.0] - 2026-03-28

### Added
- In-app CRM notifications UI with unread count in the main layout
- Notifications page support for viewing, marking individual notifications as read, and marking all as read
- Inline schedule dialog for planned `call` and `meeting` events from lead and contact detail pages
- Scheduled communication cards on lead and contact detail pages
- Status color indicators for scheduled communications
- Shared frontend helpers for friendly API error messages and datetime normalization

### Changed
- Lead creation now supports self-assignment by default and role-based assignment to sales users for `admin`, `manager`, and `superadmin`
- Lead detail editing now supports updating interested course and related group fields
- Payments table now uses nested `payment.deal.contact.fullName` and deal snapshot data when available
- Call and meeting scheduling now happens inline in the current detail page instead of navigating to the Timeline page
- Scheduling actions on lead and contact detail pages were simplified into a single `Пландоо` action
- Timeline scheduling flow now requires a planned time for `call` and `meeting` events and sends normalized ISO datetimes to the backend

### Fixed
- Payments page no longer falls back to mock data when the backend returns an error or empty result
- Payment-related validation and backend errors now surface as friendly user-facing messages
- Contact detail edit action now opens a working edit flow and refreshes displayed data after save
- Lead and legacy data tables now support pagination for large result sets
- Timeline schedule lists on lead and contact detail pages refresh after creating a new planned event

### Notes
- This frontend release depends on the backend `1.2.0` timeline and in-app notifications changes
- No frontend database migration is required
- Deploy the backend migration for in-app notifications before releasing this frontend version

---

## [1.1.0] - Previous Release

### Added
- Initial CRM frontend functionality
- Core CRM pages and navigation
- Authentication and role-based UI
- Dashboard and operational modules

---

## [1.0.0] - Initial Release

### Added
- Project initialization
- Base React application structure
- Shared UI and routing setup
