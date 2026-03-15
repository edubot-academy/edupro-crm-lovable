# EduPro CRM

EduPro CRM is a Vite + React application for managing leads, contacts, deals, payments, enrollments, and internal operations.

## Requirements

- Node.js 18+ recommended
- npm 9+ recommended

## Local development

```sh
npm i
npm run dev
```

The app runs on `http://localhost:8080` by default.

## Environment

The frontend uses `VITE_API_BASE_URL` when provided. Without it, the app defaults to:

- development: `http://localhost:4000`
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
