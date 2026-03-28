# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
