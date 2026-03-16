# EduPro CRM Frontend User Guide

This guide describes the current frontend behavior of the CRM.

Use this document when you need to know:

- which pages currently exist in the UI
- which actions are available right now
- which forms are visible in the frontend
- which sections are role-restricted in the current product

This document reflects the current frontend implementation rather than the broader backend model.

## 1. Access Rules in the Current UI

Visible to authenticated users:

- `Dashboard`
- `Leads`
- `Contacts`
- `Deals`
- `Pipeline`
- `Trial Lessons`
- `Payments`
- `LMS Enrollment`
- `Tasks`
- `Timeline`
- `Retention`

Visible only to `admin` and `superadmin`:

- `Reports`
- `Notifications`
- `Users`
- `Settings`

The header notification bell is also restricted to `admin` and `superadmin`.

## 2. Dashboard

Current behavior:

- read-only
- shows KPI cards
- shows charts for lead sources, popular courses, and manager performance

No data entry on this page.

## 3. Leads

Current frontend behavior:

- list/table view on desktop
- Trello-style single-status mobile view
- create lead dialog
- delete lead action
- search
- status filter
- row click opens lead details

### Current create fields in UI

- `Name`
- `Phone`
- `Email`
- `Source`
- `Notes`

### Current source options in UI

- `instagram`
- `telegram`
- `whatsapp`
- `website`
- `phone_call`
- `referral`

### Current notes

- lead status can be filtered
- mobile view shows one status column at a time

## 4. Contacts

Current frontend behavior:

- searchable list
- create dialog
- delete action
- row click opens contact details

### Current create fields in UI

- `Name`
- `Phone`
- `Email`
- `Notes`

### Current visible contact data

- name
- phone
- email
- `lmsStudentId` if available
- notes

## 5. Deals

Current frontend behavior:

- searchable list
- create dialog
- delete action

### Current create fields in UI

- `Student ID`
- `Course`
- `Amount`
- `Stage`

### Important current UI note

`Student ID` in the form means CRM contact ID.

### Current deal stages in UI

- `new_lead`
- `contacted`
- `trial_booked`
- `trial_completed`
- `offer_sent`
- `negotiation`
- `payment_pending`
- `won`
- `lost`

## 6. Pipeline

Current frontend behavior:

- visual Kanban board based on deals
- mainly read/monitor view

No direct create form here.

## 7. Trial Lessons

Current frontend behavior:

- searchable list
- create dialog
- delete action

### Current create fields in UI

- `Student ID`
- `Scheduled At`
- `Notes`

Important:

- the current UI uses CRM contact ID here

## 8. Payments

Current frontend behavior:

- searchable list
- create dialog
- confirm submitted payment action

### Current create fields in UI

- `Amount`
- `Method`

### Current payment methods in UI

- `card`
- `qr`
- `bank`
- `manual`

### Current payment statuses shown in UI

- `submitted`
- `confirmed`
- `failed`
- `refunded`
- `overdue`

Important:

- current create dialog does not ask for contact ID directly
- payment confirmation is available from the list for submitted payments

## 9. LMS Enrollment

Current frontend behavior:

- enrollment creation form exists
- enrollment activation dialog exists
- enrollment pause dialog exists
- student summary lookup exists

### Current fields in the enrollment form

- `Course`
- `Group`
- `Student Name`
- `Phone`
- `Email`
- `CRM Contact ID`
- `Deal ID`
- `Notes`

### Current enrollment logic in frontend

- `video` course: group is not required
- `offline` or `online_live`: group is required
- `courseType` is sent in the payload

### Current activation dialog fields

- `Payment ID`
- `Notes`

### Current pause dialog field

- `Reason`

### Current student summary field

- `LMS Student ID`

## 10. Tasks

Current frontend behavior:

- searchable list
- status filter
- create dialog
- delete action

### Current create fields in UI

- `Task Title`
- `Description`
- `Due At`

The frontend model supports more linking fields, but they are not fully exposed in the current create form.

## 11. Timeline

Current frontend behavior:

- searchable list
- add event dialog

### Current add-event fields in UI

- `Type`
- `Message`

### Current timeline event types visible through the model

- `call`
- `email`
- `sms`
- `whatsapp`
- `telegram`
- `note`
- `meeting`
- `system`

## 12. Retention

Current frontend behavior:

- searchable list
- status filter
- delete action
- quick buttons for contact/resolve/escalate in list view

### Current visible fields in UI

- `Summary`
- `Issue Type`
- `Severity`
- `Last Activity`
- `Manager`
- `Status`

### Current statuses

- `open`
- `contacted`
- `monitoring`
- `resolved`
- `escalated`

## 13. Reports

Current frontend behavior:

- restricted to `admin` and `superadmin`
- KPI cards
- charts
- CSV export
- filters

### Current filter fields in UI

- `from`
- `to`
- `source`
- `manager`
- `course`

### Current tabs in UI

- `overview`
- `sales`
- `courses`
- `retention`

## 14. Notifications

Current frontend behavior:

- restricted to `admin` and `superadmin`
- Telegram integration page

### Current actions in UI

- get Telegram linking URL
- check Telegram status
- send test Telegram message

## 15. Users

Current frontend behavior:

- restricted to `admin` and `superadmin`
- searchable list
- create user dialog
- invite dialog
- resend invite
- copy invite link
- delete action

### Current create fields in UI

- `Name`
- `Email`
- `Role`

### Current role options in UI

- `sales`
- `assistant`
- `manager`
- `admin`
- `superadmin`

### Current invite behavior

After creation:

- if backend returns `inviteUrl`, frontend shows it
- if backend returns `inviteToken`, frontend builds `/accept-invite?token=...`
- if neither is returned, frontend allows `Resend Invite`

## 16. Settings

Current frontend behavior:

- restricted to `admin` and `superadmin`
- profile section exists
- notification-related section exists

### Current profile fields in UI

- `Name`
- `Email`

## 17. Auth Pages

Current public auth pages:

- `Login`
- `Forgot Password`
- `Reset Password`
- `Accept Invite`

### Accept Invite

Current fields:

- `New Password`
- `Confirm Password`

Requires:

- `token` in the URL query string

## 18. Current Frontend ID Usage

This section explains how the current frontend expects IDs.

### CRM Contact ID

Used in:

- deals form
- trial lesson form
- enrollment form

Meaning:

- internal contact record ID in CRM

### Deal ID

Used in:

- enrollment form

Meaning:

- internal CRM deal ID

### Payment ID

Used in:

- enrollment activation dialog

Meaning:

- internal CRM payment ID

### LMS Student ID

Used in:

- student summary lookup

Meaning:

- LMS student identifier

## 19. Mobile and Tablet Behavior

Current responsive behavior:

- data-heavy list pages use mobile cards
- leads use Trello-style mobile board
- desktop/tablet keep table or board layouts
- reports tabs are horizontally scrollable on smaller screens

Pages with mobile card/list support:

- `Contacts`
- `Deals`
- `Payments`
- `Tasks`
- `Retention`
- `Trial Lessons`
- `Users`

## 20. Important Current UI Notes

- The frontend currently restricts `Users`, `Reports`, `Notifications`, and `Settings` to `admin/superadmin`.
- Invite links are supported in the current `Users` page flow.
- LMS requests include company header, request ID, and idempotency handling in the current frontend implementation.
- In development, the frontend uses Vite proxy for `/api`.

## 21. When to Use This Document

Use this guide if you need to know:

- what the user can do today in the actual frontend
- whether a field is visible in the UI
- whether a feature is already implemented in the interface

If you need operational workflow guidance instead, use:

- [STAFF_GUIDE.md](/Users/bektenorunbaev/Documents/edupro/edupro-crm-lovable/STAFF_GUIDE.md)
