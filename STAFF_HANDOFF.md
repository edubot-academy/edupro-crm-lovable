# EduPro CRM Staff Handoff

This document is a simple handoff guide for staff.

It is written in plain language.
Use it when:

- a new staff member joins
- you hand work from one employee to another
- you want a quick explanation of how the CRM should be used

## 1. What This CRM Is For

This CRM helps the team manage the full student journey:

1. a person becomes interested
2. the team contacts them
3. a deal is opened
4. payment is tracked
5. the student is enrolled into LMS
6. the team follows up if there is a risk

In simple terms:

- `Leads` = new interest
- `Contacts` = stable person record
- `Deals` = sales record
- `Payments` = money record
- `LMS Enrollment` = actual course access
- `Retention` = student risk follow-up

## 2. Who Uses What

`sales`
- works mostly in Leads, Contacts, Deals, Trial Lessons, Payments, Tasks, Timeline

`assistant`
- works mostly in Contacts, Trial Lessons, LMS Enrollment, Payments, Tasks, Timeline

`manager`
- checks Pipeline, Deals, Retention, and team progress

`admin` and `superadmin`
- have full access
- also see Users, Reports, Notifications, and Settings

## 3. The Normal Daily Workflow

This is the most important part to understand.

### Step 1: Start with Leads

When a new person comes from Instagram, Telegram, website, WhatsApp, referral, or phone call:

- create them in `Leads`
- add name
- add phone
- add email if available
- choose the source
- write useful notes

Use notes for things like:

- what course they want
- when to call them
- what questions they asked
- whether they are serious or not

### Step 2: Update Lead Status

As the conversation moves forward, update the status.

Typical statuses:

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

This helps the team know where each person stands.

### Step 3: Move to Contacts

Once the person becomes a real working record, use `Contacts`.

This should happen when:

- the person is qualified
- a trial is being arranged
- a deal is being discussed
- the person is becoming a real student/customer record

Think of `Contacts` as the stable profile for the person.

### Step 4: Create a Deal

Use `Deals` when the conversation becomes commercial.

This means:

- you know the course
- you are discussing price
- the person is close to a decision

The deal keeps track of:

- which contact this is
- what course is being sold
- how much it costs
- which sales stage it is in

### Step 5: Schedule a Trial Lesson

If the person needs a trial:

- go to `Trial Lessons`
- add the CRM Contact ID
- set the date and time
- write notes if needed

After the trial, update the result.

### Step 6: Record Payment

When the person pays or sends proof of payment:

- go to `Payments`
- add the amount
- choose the payment method

Later the payment can be confirmed.

### Step 7: Create LMS Enrollment

Once the student is ready to join the course:

- go to `LMS Enrollment`
- choose the course
- choose the group if needed
- enter the student details
- enter CRM Contact ID
- add Deal ID if there is one

Important:

- for `video` courses, group is not required
- for `offline` and `online_live`, group is required

### Step 8: Activate Enrollment

After payment or approval:

- activate the enrollment
- add Payment ID if available

This is the step that makes the enrollment active in the LMS workflow.

### Step 9: Watch for Risk

If a student has problems like:

- low attendance
- no activity
- poor homework
- poor quiz participation
- payment risk

then use `Retention`.

This is not for normal comments.
This is only for real risk follow-up.

## 4. What Each Main Section Means

### Dashboard

Use this page to quickly understand overall business performance.

It shows things like:

- total leads
- new leads
- conversion
- pending payments
- open risks

This page is for viewing only.

### Leads

Use this for brand new interest.

If the person is still in first contact stage, they belong here.

### Contacts

Use this for stable person records.

If someone is now actively managed in CRM, they should usually exist as a contact.

### Deals

Use this for the sales conversation itself.

If the discussion is about a real course and a real price, open a deal.

### Pipeline

Use this to see deals by stage in a visual way.

Managers and sales staff use this to quickly understand sales movement.

### Trial Lessons

Use this to plan and track trial classes.

### Payments

Use this to track money.

It is the financial part of the process.

### LMS Enrollment

Use this when the student should actually be enrolled into the LMS course.

This is where course access becomes real.

### Tasks

Use this for internal follow-up.

Examples:

- call back tomorrow
- confirm payment
- send schedule
- check missing document

### Timeline

Use this as the history log.

Put communication history here:

- calls
- messages
- important notes
- meeting summaries

### Retention

Use this only when the student is at risk.

Examples:

- stopped attending
- stopped doing homework
- not active
- payment issues

### Reports

Admin only.

Use this for analytics and filtering.

### Notifications

Admin only.

Use this for Telegram notification setup and testing.

### Users

Admin only.

Use this to create CRM users and send invite links.

### Settings

Admin only in current UI.

Use this for profile/system settings.

## 5. IDs Explained in Simple Terms

This is the part staff often finds confusing.

## CRM IDs

These come from CRM records.

### Contact ID

This is the CRM ID of a contact.

Use it in:

- Deals
- Trial Lessons
- LMS Enrollment

Where to get it:

- from the contact record
- from the contact page
- from the contact URL or linked record

### Deal ID

This is the CRM ID of a deal.

Use it in:

- LMS Enrollment

### Payment ID

This is the CRM ID of a payment.

Use it in:

- enrollment activation
- payment tracking

## LMS IDs

These come from the LMS side, not from the CRM side.

### LMS Student ID

This is the LMS identifier for the student.

Use it in:

- Student Summary
- Retention
- LMS-linked checks

Where to get it:

- from LMS data
- from synced contact info
- from student summary or previous enrollment-related records

### LMS Course ID

This is the LMS identifier for a course.

Normally staff should not type this manually.
It usually comes from selecting a course in the UI.

### LMS Group ID

This is the LMS identifier for a group or cohort.

Normally staff should not type this manually.
It usually comes from selecting a group in the UI.

### LMS Enrollment ID

This is the LMS identifier for a student's enrollment.

Used after enrollment exists.

## Golden Rule

CRM IDs come from CRM records.
LMS IDs come from LMS records.
Do not mix them.

## 6. What Staff Should Enter in Common Forms

### New Lead

Enter:

- full name
- phone
- email if available
- source
- useful notes

### New Contact

Enter:

- full name
- phone
- email if available
- notes

### New Deal

Enter:

- CRM Contact ID
- course name
- amount
- stage

### New Trial Lesson

Enter:

- CRM Contact ID
- date/time
- notes if needed

### New Payment

Enter:

- amount
- payment method

### New LMS Enrollment

Enter:

- course
- group if required
- student name
- phone
- email if available
- CRM Contact ID
- Deal ID if available
- notes

### New Task

Enter:

- task title
- description if needed
- due date/time

### New User

Admin only.

Enter:

- staff full name
- staff email
- role

Then send or copy the invite link.

## 7. Common Mistakes

Avoid these mistakes:

- using `lmsStudentId` where the form asks for `Contact ID`
- typing IDs manually when the page already has a selector
- creating a deal before the person is a proper working contact
- forgetting the group for live/offline LMS courses
- using Retention for normal notes instead of real risk cases
- sharing passwords with new users instead of using invite links

## 8. How to Handover Work to Another Staff Member

If you are passing work to someone else:

1. make sure the record exists in the right place
2. update the latest status
3. write clear notes
4. log important messages in Timeline
5. create a Task if follow-up is needed

Good handoff example:

- Lead status updated to `negotiation`
- notes say student wants Python evening group
- payment not yet sent
- callback needed tomorrow at 15:00
- task created for assigned staff

Bad handoff example:

- no updated status
- no notes
- no task
- next staff has to guess what happened

## 9. Staff Training Script

Use this simple explanation for onboarding:

"We start with Leads because that is where new interest comes in. Once the person becomes qualified or ready for trial or sale, we work through Contacts. A Deal is the sales record, a Payment is the money record, and LMS Enrollment is what actually gives the student access to the course. If the student later shows attendance, homework, or payment risk, we manage that in Retention."

Most important sentence:

"CRM IDs come from CRM records. LMS IDs come from LMS records. Do not mix them."

## 10. Which Document to Read Next

If you need the exact current frontend behavior, use:

- [FRONTEND_USER_GUIDE.md](/Users/bektenorunbaev/Documents/edupro/edupro-crm-lovable/FRONTEND_USER_GUIDE.md)

If you need the document index, use:

- [USER_GUIDE.md](/Users/bektenorunbaev/Documents/edupro/edupro-crm-lovable/USER_GUIDE.md)
