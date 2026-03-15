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

export interface Lead {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
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

export interface Deal {
  id: number;
  stage: DealStage;
  amount: number;
  currency: string;
  lmsCourseId?: string;
  lmsGroupId?: string;
  courseNameSnapshot?: string;
  groupNameSnapshot?: string;
  notes?: string;
  contact?: { id: number; fullName: string };
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
  contact?: { id: number; fullName: string };
  deal?: { id: number };
  company?: CompanyRef;
  createdAt: string;
  updatedAt?: string;
}

// ==================== PAYMENTS ====================
export type PaymentStatus = 'submitted' | 'confirmed' | 'failed' | 'refunded' | 'overdue';
export type PaymentMethod = 'card' | 'qr' | 'bank' | 'manual';

export interface Payment {
  id: number;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  lmsEnrollmentId?: string;
  paidAt?: string;
  user?: { id: number; fullName: string };
  company?: CompanyRef;
  createdAt?: string;
}

// ==================== TASKS ====================
export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  dueAt?: string;
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
  contactId?: number;
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

// ==================== LMS (consumed from LMS API) ====================
export interface LmsCourse {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  price?: number;
  courseType?: import('@/types/lms').LmsCourseType;
}

export interface LmsGroup {
  id: string;
  courseId: string;
  name: string;
  teacherName?: string;
  schedule?: string;
  startDate?: string;
  capacity?: number;
  enrolled?: number;
}
