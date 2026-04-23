# Sales Workflow - Sales Role

## Overview
This document describes the daily workflow for sales staff in the EduPro CRM system. Sales staff focus on converting leads into deals and closing sales.

## Daily Tasks

### 1. Review New Leads
**Screen:** Leads Page (`/leads`)

**Steps:**
- Open the Leads page to see all new leads
- Review lead qualification status:
  - **New** (Жаңы): Fresh leads that need follow-up
  - **Qualified** (Тандалды): Leads ready for contact
  - **Contacted** (Байланышылды): Leads you've reached out to
- Prioritize leads based on qualification status and source

**Actions:**
- Click on a lead to view details
- Update qualification status as you progress
- Assign to yourself if not already assigned

### 2. Contact Leads
**Screen:** Lead Detail Page (`/leads/:id`)

**Steps:**
- Review lead information (name, phone, email)
- Check if they have a product of interest (if visible)
- Contact the lead via phone or email
- Update qualification status after contact

**Actions:**
- Call the lead using the phone number
- Send email if available
- Update status to "Contacted" after reaching out
- Add notes about the conversation

### 3. Schedule Follow-up
**Screen:** Lead Detail Page (`/leads/:id`)

**Steps:**
- If lead is interested but not ready to buy, schedule a follow-up
- Use the timeline/schedule feature to set a reminder
- Add details about what to discuss

**Actions:**
- Click "Schedule Timeline Event"
- Set date and time for follow-up
- Add notes about conversation points

### 4. Convert to Deal
**Screen:** Lead Detail Page (`/leads/:id`)

**Steps:**
- When lead shows strong interest, convert to a deal
- This creates a formal sales opportunity
- Select the course/product they're interested in
- Set the expected amount

**Actions:**
- Click "Convert to Deal" (if available)
- Fill in deal details
- Select course and group (if applicable)
- Set expected payment amount

### 5. Manage Deals
**Screen:** Deals Page (`/deals`)

**Steps:**
- Monitor your active deals
- Move deals through pipeline stages:
  - **Consultation** (Консультация): Initial discussion
  - **Trial** (Сыноого өткөрүү): Trial lesson scheduled
  - **Negotiation** (Сүйлөшүүгө өтүү): Price/terms discussion
  - **Payment Pending** (Төлөм күтүү): Waiting for payment
  - **Won** (Жабылды): Sale completed
- Use quick action buttons to move deals forward

**Actions:**
- Click quick action buttons to advance deals
- View deal details for more information
- Navigate to enrollment page when deal is won

### 6. Record Payments
**Screen:** Payments Page (`/payments`)

**Steps:**
- When a customer makes a payment, record it in the system
- Link payment to the relevant deal
- Mark payment as confirmed after receiving funds

**Actions:**
- Click "Add Payment"
- Select the deal
- Enter amount and method
- Confirm payment after receiving money

## Key Screens

| Screen | URL | Purpose |
|--------|-----|---------|
| Leads | `/leads` | View and manage all leads |
| Lead Detail | `/leads/:id` | View and update specific lead |
| Deals | `/deals` | View and manage sales opportunities |
| Deal Detail | `/deals/:id` | View and update specific deal |
| Payments | `/payments` | Record and track payments |

## Success Metrics

- Lead conversion rate (leads converted to deals)
- Deal closure rate (deals marked as "Won")
- Average time to close a deal
- Total revenue from closed deals

## Tips

- Always update lead status after each contact attempt
- Add detailed notes about conversations
- Follow up promptly on scheduled reminders
- Don't hesitate to ask manager for help with difficult negotiations
