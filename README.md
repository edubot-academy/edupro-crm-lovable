# EduPro CRM Frontend

React/Vite frontend for the CRM side of the EduPro / EduBot sales flow.

## Current Business Flow

The frontend is aligned to this CRM-driven flow:

`Lead -> Contact -> Deal -> Task -> Payment -> LMS Enrollment`

Key ownership assumptions:
- CRM owns leads, contacts, deals, tasks, payments, and LMS enrollment requests
- LMS owns courses, groups, sessions, attendance, progress, recordings, and student learning access

## Current UI Conventions

The frontend no longer expects operators to manually type most internal IDs.

Implemented selector-based flows:
- `Leads`: manager, interested course, and interested group use dropdowns
- `Deals`: contact, LMS course, and LMS group use dropdowns
- `Tasks`: contact and deal use dropdowns
- `Trial Lessons`: contact and optional deal use dropdowns
- `Payments`: deal uses a dropdown
- `LMS Enrollment`: lead and optional deal use dropdowns

Auto-fill behavior:
- selecting a lead in LMS enrollment auto-fills student name, phone, and email
- selecting a deal auto-fills linked contact and LMS course/group where available
- selecting a deal in tasks and trial lessons auto-fills linked contact when available

## Reporting Split

The frontend intentionally separates analytics from funnel visualization:

- `Dashboard` -> `GET /api/dashboard/stats`
- `Reports` -> `GET /api/reports/stats`
- `Pipeline` -> `GET /api/reports/funnel` + `GET /api/deals`

## Profile UI

The profile card in `Settings` is read-only by default.

- press `Өзгөртүү` to enter edit mode
- `Жокко чыгаруу` restores original values
- `Сактоо` persists changes and returns to read-only mode

## Localization

Rules used in this frontend:
- visible UI text should be in Kyrgyz
- internal code, comments, and architecture naming stay in English
- avoid browser-native English validation messages where custom Kyrgyz validation is available

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
