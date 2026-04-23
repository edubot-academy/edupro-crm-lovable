// ==================== COMMON ====================
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
  requestId?: string;
  success?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

// ==================== AUTH ====================
export type UserRole = 'sales' | 'assistant' | 'manager' | 'admin' | 'superadmin';

export interface User {
  id: number;
  sub: string;
  email: string;
  role: UserRole;
  fullName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// ==================== COMPANIES ====================
export interface CompanyRef {
  id: number;
  name: string;
  industry: string;
}

export interface Company {
  id: number;
  name: string;
  industry: string;
  users?: SystemUser[];
}

// ==================== USERS ====================
export interface SystemUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  company?: CompanyRef;
}

export interface CreatedUserResponse extends SystemUser {
  inviteUrl?: string;
  inviteToken?: string;
}

export interface AssignableUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
}

// ==================== LEADS ====================
export type LeadSource = 'instagram' | 'telegram' | 'whatsapp' | 'website' | 'phone_call' | 'referral';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'trial_scheduled'
  | 'trial_completed'
  | 'offer_sent'
  | 'negotiation'
  | 'payment_pending'
  | 'won'
  | 'lost';

export type LeadQualificationStatus = 'new' | 'contacted' | 'qualified' | 'disqualified' | 'no_response';

export interface Lead {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  qualificationStatus?: LeadQualificationStatus;
  contactId?: number | null;
  interestedCourseId?: string;
  interestedGroupId?: string;
  notes?: string;
  tags?: string[];
  assignedManager?: { id: number; fullName: string };
  assignedManagerId?: number;
  company?: CompanyRef;
  createdAt: string;
  updatedAt: string;
}

// ==================== CONTACTS / STUDENTS ====================
export type ContactSource = 'instagram' | 'telegram' | 'whatsapp' | 'website' | 'phone_call' | 'referral';

export interface Contact {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  source?: ContactSource;
  sourceProvider?: string;
  externalStudentId?: string;
  lmsStudentId?: string;
  notes?: string;
  status?: string;
  company?: CompanyRef;
  createdAt: string;
  updatedAt: string;
}

export interface ContactNote {
  id: number;
  body: string;
  createdAt: string;
  createdBy?: { id: number; fullName: string };
}

// ==================== DEALS ====================
export type DealStage =
  | 'new_lead'
  | 'contacted'
  | 'trial_booked'
  | 'trial_completed'
  | 'offer_sent'
  | 'negotiation'
  | 'payment_pending'
  | 'won'
  | 'lost';

export type DealPipelineStage =
  | 'new'
  | 'consultation'
  | 'trial'
  | 'negotiation'
  | 'payment_pending'
  | 'won'
  | 'lost';

export interface Deal {
  id: number;
  stage: DealStage;
  pipelineStage?: DealPipelineStage;
  amount: number;
  currency: string;
  contactId?: number;
  leadId?: number | null;
  lmsCourseId?: string;
  lmsGroupId?: string;
  courseType?: import('@/types/lms').LmsCourseType;
  courseNameSnapshot?: string;
  groupNameSnapshot?: string;
  notes?: string;
  lead?: { id: number; fullName: string };
  contact?: { id: number; fullName: string; email?: string; lmsStudentId?: string };
  company?: CompanyRef;
  createdAt: string;
  updatedAt: string;
}

// ==================== TRIAL LESSONS ====================
export type TrialResult = 'pending' | 'attended' | 'missed' | 'passed' | 'failed';

export interface TrialLesson {
  id: number;
  scheduledAt: string;
  result: TrialResult;
  notes?: string;
  leadId?: number;
  lead?: { id: number; fullName: string };
  contact?: { id: number; fullName: string };
  deal?: { id: number };
  company?: CompanyRef;
  createdAt: string;
  updatedAt?: string;
}

// ==================== PAYMENTS ====================
export type PaymentStatus = 'submitted' | 'confirmed' | 'failed' | 'refunded' | 'overdue';
export type PaymentMethod = 'card' | 'qr' | 'bank' | 'manual';
export type PaymentKind = 'regular' | 'deposit';

export interface Payment {
  id: number;
  amount: number;
  kind?: PaymentKind;
  status: PaymentStatus;
  paymentStatus?: PaymentStatus;
  method: PaymentMethod;
  dealId?: number;
  leadId?: number | null;
  contactId?: number | null;
  lmsEnrollmentId?: string;
  paidAt?: string;
  user?: { id: number; fullName: string };
  deal?: {
    id: number;
    lmsCourseId?: string;
    lmsGroupId?: string;
    courseType?: import('@/types/lms').LmsCourseType;
    courseNameSnapshot?: string;
    groupNameSnapshot?: string;
    contact?: { id: number; fullName: string; email?: string };
  };
  contact?: { id: number; fullName: string; email?: string };
  company?: CompanyRef;
  createdAt?: string;
  dealPaymentSummary?: {
    dealTotal: number;
    confirmedPaid: number;
    submittedPending: number;
    refundedTotal: number;
    remaining: number;
    depositPaid: number;
    lastPaymentKind?: PaymentKind | null;
    lastPaymentStatus?: PaymentStatus | null;
  } | null;
}

// ==================== TASKS ====================
export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export type TaskWorkflowStatus = 'pending' | 'completed' | 'cancelled' | 'overdue';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  workflowStatus?: TaskWorkflowStatus;
  dueAt?: string;
  leadId?: number;
  contactId?: number;
  dealId?: number;
  retentionCaseId?: number;
  assignedTo?: { id: number; fullName: string };
  assignedToId?: number;
  company?: CompanyRef;
  createdAt: string;
  updatedAt?: string;
}

// ==================== COMMUNICATION TIMELINE ====================
export type TimelineEventType = 'call' | 'email' | 'sms' | 'whatsapp' | 'telegram' | 'note' | 'meeting' | 'system';

export interface TimelineEvent {
  id: number;
  leadId?: number;
  contactId?: number;
  dealId?: number;
  retentionCaseId?: number;
  type: TimelineEventType;
  message: string;
  meta?: Record<string, unknown>;
  company?: CompanyRef;
  createdAt: string;
}

// ==================== RETENTION / RISK ====================
export type IssueType = 'low_attendance' | 'inactive_student' | 'low_homework_completion' | 'low_quiz_participation' | 'payment_risk';
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RetentionCaseStatus = 'open' | 'contacted' | 'monitoring' | 'resolved' | 'escalated';

export interface RetentionCase {
  id: number;
  leadId?: number;
  contactId?: number;
  dealId?: number;
  lmsStudentId?: string;
  lmsEnrollmentId?: string;
  lmsCourseId?: string;
  lmsGroupId?: string;
  issueType: IssueType;
  severity: RiskSeverity;
  status: RetentionCaseStatus;
  summary?: string;
  metrics?: Record<string, unknown>;
  lastActivityAt?: string;
  assignedTo?: { id: number; fullName: string };
  assignedToId?: number;
  company?: CompanyRef;
  createdAt: string;
  updatedAt: string;
}

// ==================== NOTIFICATIONS (Telegram) ====================
export interface TelegramLinkResponse {
  url: string;
}

export interface TelegramStatusResponse {
  linked: boolean;
  chatId?: string;
}

export interface InAppNotification {
  id: number;
  type: string;
  leadId?: number | null;
  userId?: number | null;
  slotAt?: string | null;
  channel: string;
  title?: string | null;
  content?: string | null;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadNotificationsResponse {
  count: number;
}

// ==================== REPORTS ====================
export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  conversionRate: number;
  trialToSaleConversion: number;
  paymentPendingCount: number;
  wonDeals: number;
  openRetentionCases: number;
  leadsBySource: { source: string; count: number }[];
  managerPerformance: { manager: string; leads: number; deals: number; conversion: number }[];
  popularCourses: { course: string; enrollments: number }[];
}

export interface DashboardStatsQueryParams {
  from?: string;
  to?: string;
  source?: string;
  managerId?: string;
  courseId?: string;
}

export type FunnelStageKey =
  | 'lead_created'
  | 'lead_contacted'
  | 'lead_qualified'
  | 'contact_created'
  | 'deal_created'
  | 'trial_scheduled'
  | 'trial_completed'
  | 'payment_submitted'
  | 'payment_confirmed'
  | 'enrollment_requested'
  | 'enrollment_activated'
  | 'won';

export interface FunnelStageReport {
  key: FunnelStageKey;
  label: string;
  count: number;
  conversionFromPrevious: number | null;
  conversionFromStart: number | null;
  avgDaysFromPrevious: number | null;
}

export interface FunnelDropOff {
  key: 'lead_disqualified' | 'deal_lost' | 'payment_failed' | 'enrollment_cancelled';
  count: number;
}

export interface FunnelReport {
  range?: { from?: string; to?: string };
  filters?: {
    source?: string;
    managerId?: number;
    courseId?: string;
    courseType?: import('@/types/lms').LmsCourseType;
  };
  stages: FunnelStageReport[];
  dropOffs: FunnelDropOff[];
}

// ==================== LMS (consumed from LMS API) ====================
export interface LmsCourse {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  price?: number;
  courseType?: import('@/types/lms').LmsCourseType;
  status?: 'draft' | 'published' | 'archived';
  schedule?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  teacherName?: string | null;
  capacity?: number | null;
  currentStudentCount?: number | null;
  availableSeats?: number | null;
}

export interface LmsGroup {
  id: string;
  courseId: string;
  name: string;
  teacherName?: string;
  status?: import('@/types/lms').LmsGroupStatus;
  schedule?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  capacity?: number | null;
  currentStudentCount?: number | null;
  availableSeats?: number | null;
  enrolled?: number;
}
