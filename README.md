# EduPro CRM Frontend

React + Vite frontend for the CRM side of the EduPro / EduBot sales flow.

## Scope

CRM frontend owns operator workflows for:
- leads
- contacts
- deals
- tasks
- payments
- CRM-triggered LMS enrollment actions
- CRM reporting and funnel visibility

LMS-owned learning internals are not managed here:
- sessions
- attendance
- homework
- recordings
- progress
- student/instructor learning experience

## Current Contract Direction

The frontend is in a compatibility rollout from legacy backend enums toward cleaner business-facing API fields.

Canonical API fields the frontend should prefer:
- leads: `qualificationStatus`
- deals: `pipelineStage`
- tasks: `workflowStatus`
- payments: `paymentStatus`

Legacy compatibility fields still accepted/read:
- leads: `status`
- deals: `stage`
- tasks: `status`
- payments: `status`

Current frontend behavior:
- UI prefers canonical fields when present
- legacy values are still mapped for backward compatibility
- new writes should use canonical fields

## Current Business Flow

The frontend is aligned to this CRM-driven flow:

`Lead -> Contact -> Deal -> Task -> Payment -> LMS Enrollment -> LMS Activation`

Key ownership assumptions:
- CRM owns leads, contacts, deals, tasks, payments, and LMS enrollment requests
- LMS owns courses, groups, sessions, attendance, progress, recordings, and student learning access

Identity rule:
- `Lead` is not the stable student identity
- `Contact` is the durable CRM person record
- `externalStudentId` is the stable CRM-side person key
- `lmsStudentId` is the LMS student/user mapping written back after enrollment create or reuse

## CRM ↔ LMS Integration Assumptions

The frontend expects these CRM backend integration behaviors:
- LMS course/group selection is fetched from CRM passthrough endpoints
- enrollment create/activate flows use normalized public LMS statuses:
  - `pending`
  - `active`
  - `completed`
  - `cancelled`
- `groupId` may be null for `video` courses
- CRM uses `crmContactId` in enrollment and activation payloads
- browser LMS integration calls rely on backend CORS allowing:
  - `X-Company-Id`
  - `X-Request-Id`
  - `X-Idempotency-Key`
- LMS enrollment errors surface CRM `Request ID` values when available
- the Enrollments page includes an integration history panel for tracing:
  - CRM -> LMS transport attempts
  - LMS -> CRM webhook events
  - filtered by CRM ids or LMS student/enrollment ids

## Current UI Conventions

The frontend no longer expects operators to manually type most internal IDs.

Implemented selector-based flows:
- `Leads`: manager, interested course, and interested group use dropdowns
- `Courses`: read-only LMS catalog visibility for sales
- `Deals`: contact, LMS course, LMS group, and pipeline stage use dropdowns
- `Tasks`: contact and deal use dropdowns
- `Trial Lessons`: contact and optional deal use dropdowns
- `Payments`: deal uses a dropdown
- `LMS Enrollment`: lead and optional deal use dropdowns

Sales visibility in LMS selectors:
- CRM course and group selectors surface LMS-owned visibility data for decision support:
  - course type
  - start date
  - schedule
  - teacher
  - current seats / available seats
  - group availability badges in Kyrgyz
- CRM still treats LMS as the source of truth and does not manage academic structures directly

Sell-flow shortcuts:
- the `Courses` page can open:
  - a new CRM deal with LMS course/group prefilled
  - the LMS enrollment form with LMS course/group prefilled
- prefills are passed through route query params and stay read-only with respect to LMS ownership

Post-sale LMS visibility:
- `Contact detail` shows a live LMS student snapshot when `lmsStudentId` is linked
- the snapshot includes enrollments and academic summary metrics from LMS
- the `Enrollments` page can open with a prefilled LMS student summary via `studentId` query param
- `Contact detail` also shows recent LMS integration events and links into the full enrollments/integration history view with prefilled filters
- `Deal detail` shows the sold LMS snapshot, linked payments, and filtered integration history for the specific sale

Auto-fill behavior:
- selecting a lead in LMS enrollment auto-fills student name, phone, and email
- selecting a deal auto-fills linked contact and LMS course/group where available
- selecting a deal in tasks and trial lessons auto-fills linked contact when available

## Reporting Split

The frontend intentionally separates KPI reporting from funnel visualization:

- `Dashboard` -> `GET /api/dashboard/stats`
- `Reports` -> `GET /api/reports/stats`
- `Pipeline` -> `GET /api/reports/funnel` + `GET /api/deals`

Pipeline UI note:
- the board groups deals by canonical `pipelineStage`
- legacy `stage` responses are mapped client-side during rollout

## Localization

Rules used in this frontend:
- visible UI text should be in Kyrgyz
- internal code, comments, and architecture naming stay in English
- avoid browser-native English validation messages where custom Kyrgyz validation is available

## Profile UI

The profile card in `Settings` is read-only by default.

- press `Өзгөртүү` to enter edit mode
- `Жокко чыгаруу` restores original values
- `Сактоо` persists changes and returns to read-only mode

## Development

Requirements:
- Node.js
- npm

Typical local run:

```sh
npm install
npm run dev
```

The app expects the CRM backend at:
- `http://localhost:4000` by default in development

You can override it with:
- `VITE_API_BASE_URL`

## Environment Behavior

Without `VITE_API_BASE_URL`, the frontend defaults to:
- development: `/api` via the Vite dev proxy to `http://localhost:4000`
- production: `https://api.edupro.edubot.it.com`

## Scripts

```sh
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
