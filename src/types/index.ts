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

// ==================== FEATURE FLAGS ====================
export type FeatureFlag =
  | 'crm_enabled'
  | 'lms_bridge_enabled'
  | 'trial_lessons_enabled'
  | 'retention_enabled'
  | 'telegram_notifications_enabled'
  | 'advanced_reports_enabled'
  | 'payments_enabled'
  | 'whatsapp_integration_enabled'
  | 'custom_roles_enabled'
  | 'custom_domain_enabled';

export interface FeatureFlags {
  crm_enabled: boolean;
  lms_bridge_enabled: boolean;
  trial_lessons_enabled: boolean;
  retention_enabled: boolean;
  telegram_notifications_enabled: boolean;
  advanced_reports_enabled: boolean;
  payments_enabled: boolean;
  whatsapp_integration_enabled: boolean;
  custom_roles_enabled: boolean;
  custom_domain_enabled: boolean;
}

// ==================== TENANT CONFIGURATION ====================
export interface TenantConfig {
  id?: number;
  tenantId: string;
  language: string;
  currency: string;
  timezone: string;
  companyName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  branding?: BrandingConfig;
  leadSources: TenantLeadSource[];
  paymentMethods: TenantPaymentMethod[];
  notificationChannels: NotificationChannel[];
  pipelineStages: PipelineStageConfig[];
  leadStatuses: StatusConfig[];
  dealStatuses: StatusConfig[];
  roles: RoleConfig[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantPaymentMethod {
  id?: number;
  tenantId: string;
  methodKey: string;
  methodName: string;
  methodType: 'card' | 'qr' | 'bank' | 'manual' | 'other';
  config?: Record<string, unknown>;
  enabled: boolean;
  displayOrder: number;
}

export interface TenantLeadSource {
  id?: number;
  tenantId: string;
  sourceKey: string;
  sourceName: string;
  isDefault?: boolean;
}

export interface BrandingConfig {
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  companyName?: string | null;
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'telegram' | 'sms' | 'whatsapp';
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface PipelineStageConfig {
  id: string;
  key: string;
  label: string;
  order: number;
  color?: string;
}

export interface StatusConfig {
  id: string;
  key: string;
  label: string;
  order: number;
  entityType: string;
}

export interface RoleConfig {
  id: string;
  key: string;
  label: string;
  permissions: Record<string, boolean>;
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
export type LeadSource = 'instagram' | 'telegram' | 'whatsapp' | 'website' | 'phone_call' | 'referral' | 'other';

/**
 * CRM-native lead statuses
 * These are generic CRM statuses that apply to any business type
 * Education-specific trial statuses should be handled in the education layer or tenant-configured stages
 * Changed to string type to support tenant-configured statuses
 */
export type LeadStatus = string;

export interface Lead {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  contactId?: number | null;
  notes?: string;
  tags?: string[];
  assignedManager?: { id: number; fullName: string };
  assignedManagerId?: number;
  interestedCourseId?: string | null;
  interestedGroupId?: string | null;
  courseType?: import('@/types/lms').LmsCourseType | null;
  interestLevel?: 'low' | 'medium' | 'high' | null;
  company?: CompanyRef;
  createdAt: string;
  updatedAt: string;
}

export interface LeadWritePayload {
  fullName?: string;
  phone?: string;
  email?: string;
  source?: LeadSource;
  status?: LeadStatus;
  assignedManagerId?: number | null;
  tags?: string[];
  notes?: string;
  interestedCourseId?: string | null;
  interestedGroupId?: string | null;
  courseType?: import('@/types/lms').LmsCourseType | null;
  interestLevel?: 'low' | 'medium' | 'high' | null;
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
/**
 * CRM-native deal stages
 * These are generic CRM stages that apply to any business type
 * Education-specific trial stages should be handled in the education layer or tenant-configured stages
 */
export type DealStage =
  | 'new_lead'
  | 'contacted'
  | 'qualified'
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
  notes?: string;
  lead?: { id: number; fullName: string };
  contact?: { id: number; fullName: string; email?: string };
  lmsMapping?: {
    lmsCourseId?: string;
    lmsGroupId?: string;
    courseType?: import('@/types/lms').LmsCourseType;
    courseNameSnapshot?: string;
    groupNameSnapshot?: string;
  };
  company?: CompanyRef;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealPayload {
  contactId?: number;
  leadId?: number;
  trialLessonId?: number;
  amount?: number;
  currency?: string;
  stage?: DealStage;
  pipelineStage?: DealPipelineStage;
  notes?: string;
  lmsCourseId?: string | null;
  lmsGroupId?: string | null;
  courseType?: import('@/types/lms').LmsCourseType | null;
  courseNameSnapshot?: string | null;
  groupNameSnapshot?: string | null;
}

export interface UpdateDealPayload {
  contactId?: number;
  leadId?: number;
  amount?: number;
  currency?: string;
  stage?: DealStage;
  pipelineStage?: DealPipelineStage;
  notes?: string;
  lmsCourseId?: string | null;
  lmsGroupId?: string | null;
  courseType?: import('@/types/lms').LmsCourseType | null;
  courseNameSnapshot?: string | null;
  groupNameSnapshot?: string | null;
}

// ==================== TRIAL LESSONS ====================
export type TrialResult = 'pending' | 'attended' | 'missed' | 'passed' | 'failed';

export interface TrialLesson {
  id: number;
  scheduledAt: string;
  result: TrialResult;
  trialTopic?: string | null;
  lmsCourseId?: string | null;
  lmsGroupId?: string | null;
  courseType?: import('@/types/lms').LmsCourseType | null;
  contactId?: number | null;
  dealId?: number | null;
  notes?: string;
  leadId?: number;
  lead?: { id: number; fullName: string };
  contact?: { id: number; fullName: string };
  deal?: { id: number };
  company?: CompanyRef;
  createdAt: string;
  updatedAt?: string;
}

export interface TrialLessonWritePayload {
  leadId?: number;
  contactId?: number;
  dealId?: number;
  scheduledAt?: string;
  result?: TrialResult;
  notes?: string;
  trialTopic?: string;
  lmsCourseId?: string;
  lmsGroupId?: string;
  courseType?: import('@/types/lms').LmsCourseType;
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
  paidAt?: string;
  user?: { id: number; fullName: string };
  deal?: {
    id: number;
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

// CRM-only dashboard stats
export interface CrmDashboardStats {
  totalLeads: number;
  newLeads: number;
  conversionRate: number;
  paymentPendingCount: number;
  wonDeals: number;
  openRetentionCases: number;
  leadsBySource: { source: string; count: number }[];
  managerPerformance: { manager: string; leads: number; deals: number; conversion: number }[];
}

// Education/LMS-specific dashboard stats
export interface EducationDashboardStats {
  trialToSaleConversion: number;
  popularCourses: { course: string; enrollments: number }[];
}

// Combined dashboard stats (for backward compatibility)
export interface DashboardStats extends CrmDashboardStats, EducationDashboardStats { }

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
