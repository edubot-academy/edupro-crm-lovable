# Manager Workflow - Manager Role

## Overview
This document describes the daily workflow for manager staff in the EduPro CRM system. Manager staff oversee sales operations, handle complex customer situations, and ensure team performance.

## Daily Tasks

### 1. Review Sales Performance
**Screen:** Dashboard (`/`)

**Steps:**
- Check dashboard for key metrics
- Review lead conversion rates
- Monitor deal pipeline status
- Identify bottlenecks in sales process

**Actions:**
- Analyze dashboard charts and statistics
- Identify underperforming areas
- Plan interventions to improve performance

### 2. Monitor Team Activity
**Screen:** Leads Page (`/leads`) and Deals Page (`/deals`)

**Steps:**
- Review leads assigned to team members
- Check deal progression for each sales staff
- Identify deals that need manager intervention
- Monitor team workload distribution

**Actions:**
- View leads by assigned manager
- Check deal pipeline stages
- Reassign leads/deals if needed
- Identify deals stuck in negotiation

### 3. Handle Complex Situations
**Screen:** Deal Detail Page (`/deals/:id`)

**Steps:**
- Review deals that need special attention
- Assess customer objections or concerns
- Determine appropriate intervention strategy
- Personally contact high-value customers if needed

**Actions:**
- View deal details and history
- Add notes with strategic guidance
- Contact customer directly for high-value deals
- Update deal stage based on outcome

### 4. Approve Enrollments
**Screen:** Enrollments Page (`/enrollments`) - **Admin only**

**Steps:**
- Review pending enrollment requests (requires admin role)
- Verify enrollment details are correct
- Approve or reject enrollment requests
- Handle enrollment issues or exceptions

**Actions:**
- View pending enrollments tab
- Review student and course information
- Click approve/reject with notes
- Handle special cases requiring manual intervention

**Note:** Enrollment approval is restricted to admin role. Managers should escalate to admin for enrollment approval.

### 5. Manage Retention Cases
**Screen:** Retention Page (`/retention`)

**Steps:**
- Monitor students at risk of dropping out
- Review retention case details
- Plan intervention strategies
- Track retention outcomes

**Actions:**
- View retention cases by risk level
- Check student attendance and performance
- Schedule intervention actions
- Track case resolution

### 6. View Student Progress
**Screen:** Contact Detail Page (`/contacts/:id`) - **Admin only for LMS data**

**Steps:**
- Monitor enrolled student performance (requires admin role for LMS data)
- Check attendance and homework completion
- Identify students who need support
- Review academic progress metrics

**Actions:**
- Use Student Summary panel for detailed view (admin only)
- Check attendance rates and homework completion
- Identify at-risk students
- Coordinate with instructors for support

**Note:** Student academic information and LMS data are restricted to admin role. Managers should escalate to admin for detailed student progress data.

### 7. Review Payments
**Screen:** Payments Page (`/payments`)

**Steps:**
- Monitor payment collection status
- Identify overdue payments
- Review payment disputes
- Ensure payment records are accurate

**Actions:**
- View pending payments
- Follow up on overdue payments
- Resolve payment issues
- Verify payment reconciliation

### 8. Team Management
**Screen:** Users Page (`/users`) - **Admin only**

**Steps:**
- Review team member performance (requires admin role)
- Assign leads and deals to team members
- Monitor team workload
- Provide coaching and support

**Actions:**
- View user list and activity (admin only)
- Reassign leads/deals for balance
- Review individual performance metrics
- Provide feedback and guidance

**Note:** User management is restricted to admin role. Managers should escalate to admin for user management tasks.

## Key Screens

| Screen | URL | Purpose |
|--------|-----|---------|
| Dashboard | `/` | View overall performance metrics |
| Leads | `/leads` | Monitor team lead management |
| Deals | `/deals` | Review deal pipeline and progress |
| Enrollments | `/enrollments` | Approve and manage enrollments |
| Retention | `/retention` | Manage student retention cases |
| Payments | `/payments` | Monitor payment collection |
| Users | `/users` | Manage team members |
| Reports | `/reports` | View detailed reports |

## Leadership Responsibilities

### Performance Monitoring
- Track team conversion rates
- Monitor individual sales performance
- Identify training needs
- Set performance targets

### Customer Relations
- Handle escalated customer issues
- Build relationships with key accounts
- Ensure customer satisfaction
- Resolve complex disputes

### Process Improvement
- Identify workflow bottlenecks
- Suggest process improvements
- Implement best practices
- Ensure quality standards

### Team Development
- Provide coaching and mentorship
- Conduct performance reviews
- Facilitate training
- Foster team collaboration

## Decision-Making Authority

As a manager, you have authority to:
- View student academic information (canViewStudentSummary)
- Manage retention cases (canViewRetentionCases)
- Escalate enrollment approval to admin (enrollment approval is admin-only)
- Escalate user management to admin (user management is admin-only)
- Note: Integration history and technical LMS fields are admin-only

## Tips

- Proactively identify and address issues before they escalate
- Use data to support decisions
- Document important decisions and reasoning
- Communicate clearly with team members
- Balance customer needs with business goals
- Escalate to admin only for exceptional cases
