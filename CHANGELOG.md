# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Version bumps are classified by delivery scale; see `VERSIONING.md`.

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
