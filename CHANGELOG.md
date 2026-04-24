# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Version bumps are classified by delivery scale; see `VERSIONING.md`.

## [1.7.1] - 2026-04-24

### Added
- CRM/LMS separation planning docs for frontend, backend, and platform decomposition
- Role permission hook for centralized CRM, LMS, admin, and retention visibility checks
- Workflow docs for sales, assistant, and manager daily operations
- LMS bridge enablement mechanism using React Context with `LmsBridgeProvider` and `useLmsBridge` hook

### Changed
- Phase 2.3 CRM-LMS decoupling: bridge components (LeadCourseInterest, ContactStudentMapping, DealCourseMapping) now check LMS bridge flag in addition to permissions
- Phase 2.3 CRM-LMS decoupling: removed unused LMS course/group hooks from Leads.tsx
- Phase 2.3 CRM-LMS decoupling: LMS enrollment buttons in Leads and Deals tables now conditional on LMS bridge flag
- Phase 2.3 CRM-LMS decoupling: removed LMS field IDs from enrollment navigation params (courseId, groupId, studentId)
- Phase 2.4 CRM-LMS decoupling: removed @deprecated annotations from type definitions, replaced with clear documentation that these are LMS bridge fields

### Fixed
- Dashboard now uses split `getCrmStats` and `getEducationStats` endpoints instead of legacy combined `getStats`, properly decoupling CRM from LMS data
- Reports page now uses the original `reportsApi.getStats` endpoint instead of dashboard endpoints to preserve report-specific backend behavior
- Reports course filter now ignores URL params when LMS bridge is disabled, preventing hidden filters from bookmarked URLs
- Reports CSV export now conditionally includes LMS-only data (trial conversion, course rows) based on LMS bridge flag
- Reports trial conversion KPI card is hidden when LMS bridge is disabled
- LMS bridge is now truly optional - CRM UI keeps working with empty LMS stats when education endpoint fails, instead of failing the entire page

### Changed
- Role-based navigation now hides LMS and admin surfaces unless the current role is allowed to access them
- Leads, contacts, deals, payments, and LMS support panels now use centralized permission checks instead of scattered role comparisons
- Lead assignment permissions are now modeled separately from full user management so managers can still assign sales work
- Deal and lead UI copy now uses more business-friendly product wording in several LMS-linked flows
- Phase 2 CRM-LMS decoupling: removed LMS course/group loading hooks from Leads.tsx and LeadDetail.tsx
- Phase 2 CRM-LMS decoupling: removed LMS selectors from lead create/edit forms
- Phase 2 CRM-LMS decoupling: removed LMS fields (interestedCourseId, interestedGroupId) from lead API payloads
- Phase 2 CRM-LMS decoupling: removed LMS fields (courseType, courseNameSnapshot, groupNameSnapshot, lmsCourseId, lmsGroupId) from Deals.tsx form state
- Phase 2 CRM-LMS decoupling: removed LMS selectors from deal creation dialog
- Phase 2 CRM-LMS decoupling: removed LMS enrollment logic functions from Payments.tsx
- Phase 2 CRM-LMS decoupling: removed course/group snapshots from payment deal labels
- Phase 2 CRM-LMS decoupling: removed LMS course/group loading hooks from Deals.tsx
- Leads.tsx form state now uses correct types: assignedManagerId as number, tags as string[]
- Tags input in Leads.tsx now handles comma-separated string input for string[] type

### Fixed
- LMS-only fields, IDs, history panels, and enrollment actions are now hidden from non-admin roles across list and detail views
- Manager lead assignment flow no longer regresses after permission centralization
- Legacy migration navigation is again restricted to superadmin only
- Deal enrollment navigation now points to the reachable `/enrollments` route
- Payment warnings and deal labels no longer expose LMS-only context to unauthorized roles
- ContactDetail.tsx now uses canViewStudentSummary() instead of canViewLmsTechnicalFields() for student summary, allowing managers to see student summary data as intended
- DealCourseMapping.tsx enrollment navigation now uses crmDealId query param instead of dealId, matching EnrollmentForm expectations
- EnrollmentsPage now seeds initialHistoryFilters with crmDealId for deal context, enabling proper prefiltering from deal detail "Толук тарых" navigation
- Removed references to setManagersLoading in Leads.tsx (removed with LMS hooks)
- Removed references to courses variable in Leads.tsx (removed with LMS hooks)

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
