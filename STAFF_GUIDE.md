# EduPro CRM Staff Guide

This guide explains how staff should use the CRM in daily work.

It covers:
- what each section is for
- what each field means
- what to enter
- where to get IDs and linked data
- which roles should use which sections
- the usual workflow from lead to enrolled student

This document is written for CRM users, not developers. Internal backend details are kept to a minimum.

## 1. Roles

The platform supports these roles:

- `sales`
- `assistant`
- `manager`
- `admin`
- `superadmin`

System sections visible only to `admin` and `superadmin`:

- `Users`
- `Reports`
- `Notifications`
- `Settings`

Recommended day-to-day usage:

- `sales`: Leads, Deals, Trial Lessons, Payments, Tasks, Timeline
- `assistant`: Leads, Trial Lessons, LMS Enrollment, Payments, Timeline, Tasks
- `manager`: Pipeline, Deals, Retention, team oversight
- `admin` and `superadmin`: full operational access plus system sections

## 2. Main Navigation

Main operational sections:

- `Dashboard`
- `Leads`
- `Contacts Data`
- `Deals`
- `Pipeline`
- `Trial Lessons`
- `Payments`
- `LMS Enrollment`
- `Tasks`
- `Timeline`
- `Retention`

System sections:

- `Reports`
- `Notifications`
- `Users`
- `Settings`

## 3. The Core Workflow

Use this flow for most students:

1. Create a record in `Leads` when a new person shows interest.
2. Update the lead status as communication progresses.
3. Keep the active workflow on the same record in `Leads`.
4. Create a `Deal` when you are discussing a real course and price.
5. Schedule a `Trial Lesson` if needed.
6. Record a `Payment` when money is submitted.
7. Create an `LMS Enrollment` after the course is confirmed.
8. Activate the enrollment after payment or approval.
9. Monitor the student in `Retention` if there are activity or payment risks.

Simple explanation for staff:

- `Leads` = new interest
- `Contacts Data` = old historical records only
- `Deals` = sales process
- `Payments` = money tracking
- `LMS Enrollment` = actual course access
- `Retention` = at-risk student follow-up

## 4. Dashboard

Purpose:

- gives a quick overview of business performance
- shows lead flow, payment status, retention risk, and course popularity

Typical KPIs:

- `Total Leads`
- `New Leads`
- `Conversion Rate`
- `Trial to Sale Conversion`
- `Payment Pending`
- `Won Deals`
- `Open Retention Cases`

This page is read-only. No data is entered here.

## 5. Leads

Purpose:

- capture newly interested people
- track them through the early sales funnel

Use `Leads` when the person is still in early communication and is not yet a stable student/contact record.

### Fields in "New Lead"

`Name`
- Enter the person's full name.

`Phone`
- Enter the main contact phone number.
- Recommended format: `+996 ...`

`Email`
- Enter if available.

`Source`
- Select where the lead came from:
- `instagram`
- `telegram`
- `whatsapp`
- `website`
- `phone_call`
- `referral`

`Notes`
- Add useful context such as:
- interested course
- budget concerns
- objections
- preferred callback time

### Lead statuses

- `new`
- `contacted`
- `interested`
- `trial_scheduled`
- `trial_completed`
- `offer_sent`
- `negotiation`
- `payment_pending`
- `won`
- `lost`

### Important operational rule

Do not move active work into `Contacts Data`.

Use `Lead ID` for:

- deals
- trial lessons
- LMS enrollment
- tasks
- timeline
- retention

## 6. Contacts Data

Role:

- `superadmin` only

Purpose:

- inspect old historical contact records
- access legacy LMS-linked data
- import old records into the lead-first workflow

Do not use `Contacts Data` in daily sales work.

### Important linked fields

`lmsStudentId`
- This is the LMS student identifier.
- Staff should not invent this manually.
- It usually comes from LMS sync, an existing enrollment, or student summary data.

`externalStudentId`
- Optional identifier from another external system.

### Contact ID

`Contact ID` is the internal legacy identifier for a historical contact record.

You can get it from:

- the contact details page
- the record URL
- the create response
- linked records elsewhere in the app

This ID is used only for controlled migration:

- `POST /leads/import-from-contact/:contactId`

## 7. Deals

Purpose:

- track the commercial side of a sale
- store course, amount, and sales stage

### Fields in "New Deal"

`Lead ID`
- This must be the `Lead ID`.
- Do not enter `Contact ID` or `lmsStudentId` here.

`Course`
- Enter or select the human-readable course name.

`Amount`
- Enter the agreed or proposed deal amount.

`Stage`
- Select the current sales stage.

### Deal stages

- `new_lead`
- `contacted`
- `trial_booked`
- `trial_completed`
- `offer_sent`
- `negotiation`
- `payment_pending`
- `won`
- `lost`

### Important notes

- `Deal ID` is the internal CRM identifier for a deal.
- This ID is used later in LMS enrollment as `crmDealId`.
- Course and group names may be saved as snapshots for reporting, but staff should focus on the visible course/group information in the UI.

## 8. Pipeline

Purpose:

- visualize deals as a Kanban board by stage
- monitor overall sales progress

This page is mainly for viewing and managing the funnel visually. It is not usually the main place for detailed data entry.

## 9. Trial Lessons

Purpose:

- manage scheduled trial lessons
- record results and notes

### Fields in "New Trial Lesson"

`Lead ID`
- Use the CRM `Lead ID`.
- Do not use `Contact ID` or `lmsStudentId`.

`Deal ID`
- Optional if the trial is linked to a deal.

`Scheduled At`
- Enter the planned date and time.

`Notes`
- Add context, expectations, or teacher/support notes.

### Trial results

- `pending`
- `attended`
- `missed`
- `passed`
- `failed`

## 10. Payments

Purpose:

- record submitted payments
- track payment verification state

### Fields in "New Payment"

`Amount`
- Enter the payment amount.

`Method`
- Select the payment method available in the UI, for example:
- `Card`
- `QR`
- `Bank Transfer`
- `Manual`

`Status`
- Payment state usually follows:
- `submitted`
- `confirmed`
- `failed`
- `refunded`
- `overdue`

### Important payment fields

`Payment ID`
- Internal CRM payment identifier.
- Used later for enrollment activation or payment tracking.

`lmsEnrollmentId`
- LMS enrollment reference if the payment is linked to an LMS enrollment.
- Usually appears after enrollment exists.

## 11. LMS Enrollment

Purpose:

- enroll CRM leads into LMS courses and groups
- activate or pause enrollments
- inspect LMS student summary

### 11.1 New Enrollment

### Fields

`Course`
- Select from the LMS course list.
- This provides the LMS `courseId` and `courseType`.

`Group`
- Select from the LMS groups list when required.

`Student Name`
- Enter the full student name.

`Phone`
- Enter the student's phone number.

`Email`
- Optional.

`CRM Lead ID`
- This is the CRM `Lead ID`.

`Deal ID`
- Optional CRM `Deal ID`.

`Payment ID`
- Optional CRM `Payment ID` if already known and linked.

`Notes`
- Internal notes for the enrollment record.

### Enrollment rules

If `courseType = video`
- `groupId` is not required

If `courseType = offline` or `courseType = online_live`
- `groupId` is required

### What the IDs mean

`crmLeadId`
- CRM lead identifier

`crmDealId`
- CRM deal identifier if the enrollment is tied to a deal

`crmPaymentId`
- CRM payment identifier if payment is already linked

`courseId`
- LMS course identifier

`groupId`
- LMS group identifier, or empty for `video` courses

### Where to get IDs

`Lead ID`
- from `Leads`

`Deal ID`
- from `Deals`

`Payment ID`
- from `Payments`

`courseId`
- from the LMS course selector

`groupId`
- from the LMS group selector

### 11.2 Activate Enrollment

Fields:

`CRM Lead ID`
- required for activation request

`Payment ID`
- optional, if there is a linked payment

`Payment Status`
- usually set to the appropriate current state such as `confirmed`

`Notes`
- operational notes for activation

### 11.3 Pause Enrollment

Fields:

`Reason`
- required explanation for pausing

### 11.4 Student Summary

Field:

`LMS Student ID`

Purpose:

- load LMS student information
- review enrollments
- inspect attendance, homework, quiz participation, progress, and risk

### Where to get LMS Student ID

You can usually get it from:

- the contact field `lmsStudentId`
- an existing LMS enrollment
- LMS data shown in student summary or linked records

## 12. Tasks

Purpose:

- manage follow-ups and internal work

### Fields in "New Task"

`Task Title`
- short action title

`Description`
- optional explanation

`Due At`
- deadline date and time

### Optional linked fields

- `assignedToId`
- `leadId`
- `dealId`
- `retentionCaseId`

Use tasks for reminders, callbacks, document collection, and internal ownership.

## 13. Timeline

Purpose:

- log communication history
- keep important actions in one place

### Fields in "Add Event"

`Type`
- event type such as:
- `call`
- `email`
- `sms`
- `whatsapp`
- `telegram`
- `note`
- `meeting`
- `system`

`Message`
- write the message itself or a useful summary

### Optional linked fields

- `leadId`
- `dealId`
- `retentionCaseId`
- `meta`

Use timeline for operational history, not only for general summaries.

## 14. Retention

Purpose:

- manage students at academic or payment risk

### Important fields

`Issue Type`
- type of risk:
- `low_attendance`
- `inactive_student`
- `low_homework_completion`
- `low_quiz_participation`
- `payment_risk`

`Severity`
- `low`
- `medium`
- `high`
- `critical`

`Last Activity`
- last meaningful student activity date

`Summary`
- short human-readable explanation

`Manager`
- responsible user if assigned

### Statuses

- `open`
- `contacted`
- `monitoring`
- `resolved`
- `escalated`

### LMS-linked fields

- `lmsStudentId`
- `lmsEnrollmentId`
- `lmsCourseId`
- `lmsGroupId`

### Where to get those IDs

Usually from:

- LMS data
- student summary
- backend sync
- previous enrollment records

## 15. Reports

Role:

- `admin` and `superadmin` only

Purpose:

- analytics and filtering

### Main KPIs

- `totalLeads`
- `newLeads`
- `conversionRate`
- `trialToSaleConversion`
- `paymentPendingCount`
- `wonDeals`
- `openRetentionCases`

### Filters

`from`
- format: `yyyy-MM-dd`

`to`
- format: `yyyy-MM-dd`

`source`
- lead source filter

`manager`
- manager name filter

`course`
- course name filter

No manual ID entry is needed here.

## 16. Notifications

Role:

- `admin` and `superadmin` only

Purpose:

- manage Telegram notification integration

Typical actions:

- get Telegram link
- check Telegram link status
- send a test Telegram message

Use this section only for notification setup and checks.

## 17. Users

Role:

- `admin` and `superadmin` only

Purpose:

- create internal CRM users
- assign roles
- invite users securely

### Fields in "New User"

`Name`
- full name of employee

`Email`
- email used for sign-in and invitation

`Role`
- choose one:
- `sales`
- `assistant`
- `manager`
- `admin`
- `superadmin`

### Invite flow

After user creation:

- the backend may return `inviteUrl`
- the backend may return `inviteToken`
- if only token exists, the frontend can build `/accept-invite?token=...`

If no invite link is shown:

- use `Resend Invite`

### Why invite links matter

- the user sets their own password
- admins do not need to share passwords
- onboarding is safer

## 18. Settings

Role:

- `admin` and `superadmin` only in the current UI

Purpose:

- profile and system-level settings access

### Profile fields

`Name`
- current user's full name

`Email`
- current user's email

## 19. Authentication Flows

### Login

Fields:

- `Email`
- `Password`

### Accept Invite

Purpose:

- complete account setup from an invite link

Fields:

- `New Password`
- `Confirm Password`

Required:

- valid invite `token` in the URL

### Forgot Password

Purpose:

- request a password reset link by email

### Reset Password

Purpose:

- set a new password using the reset token

## 20. IDs Explained

This is the most common source of confusion.

### CRM Contact ID

What it is:

- legacy historical contact ID

Where to get it:

- contact details page
- record URL
- backend or create response
- linked records inside the app

Where it is used:

- only for legacy import from contacts into leads

### Lead ID

What it is:

- internal CRM ID of a lead

Where used:

- lead details
- lead updates and deletes

### Deal ID

What it is:

- internal CRM ID of a deal

Where used:

- LMS enrollment linking
- sales workflow references

### Payment ID

What it is:

- internal CRM payment ID

Where used:

- enrollment activation
- payment tracking

### LMS Student ID

What it is:

- LMS student identifier

Where to get it:

- LMS directly
- synced contact field `lmsStudentId`
- student summary or enrollment-related data

Where used:

- student summary lookup
- retention
- LMS-linked workflows

### LMS Course ID

What it is:

- LMS course identifier

Where to get it:

- LMS course selector
- LMS records

Where used:

- enrollment creation
- LMS linkage

### LMS Group ID

What it is:

- LMS group or cohort identifier

Where to get it:

- LMS group selector
- LMS group records

Where used:

- enrollment creation
- retention records
- LMS linkage

### LMS Enrollment ID

What it is:

- LMS enrollment identifier

Where to get it:

- enrollment create or activate response
- LMS student summary

Where used:

- payment linkage
- enrollment lifecycle

## 21. Common Mistakes To Avoid

- Do not use `lmsStudentId` where the system asks for a historical `Contact ID` during legacy import.
- Do not use legacy `Contact ID` in places that ask for `Lead ID`.
- Do not type IDs manually if the page already has a selector.
- Do not create a deal before the person exists as a proper contact record.
- Do not forget `groupId` for `offline` and `online_live` courses.
- Do not use `Retention` for normal notes; use `Timeline` or `Tasks` unless there is real student risk.
- Do not share passwords for new users; use the invite flow.

## 22. If You Are Not Sure What To Enter

Use this rule:

- if the field asks for a CRM ID in active workflow, get it from Leads, Deals, or Payments
- if the field asks for an LMS ID, get it from LMS selectors, LMS records, or synced LMS fields
- if a selector exists, use the selector instead of typing IDs manually

## 23. Short Script For Staff Training

Use this explanation when onboarding staff:

"We start with `Leads` because that is where new interest comes in. We keep the active workflow on the lead record and use `Lead ID` in deals, trial lessons, payments, and LMS enrollment. `Contacts Data` is only for old historical records and controlled migration. A `Deal` is the sales record, a `Payment` is the money record, and `LMS Enrollment` is what actually gives the student access to the course. If the student later shows attendance, homework, or payment risk, we manage that in `Retention`."

Most important rule to repeat:

"CRM IDs come from CRM records. LMS IDs come from LMS records. Do not mix them."

## 24. Related Internal Docs

For technical or admin reference, also see:

- `docs/backend/CRM_ENDPOINTS_REFERENCE.md`
- `docs/backend/CRM_BACKEND_IMPLEMENTATION_STATUS.md`
- `docs/shared/contracts/CRM_LMS_API_CONTRACT.md`
