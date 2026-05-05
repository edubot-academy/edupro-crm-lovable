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
  | 'custom_domain_enabled'
  | 'ai_assist_enabled'
  | 'ai_followup_drafts_enabled'
  | 'ai_operator_guidance_enabled'
  | 'ai_insight_persistence_enabled';

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
  ai_assist_enabled: boolean;
  ai_followup_drafts_enabled: boolean;
  ai_operator_guidance_enabled: boolean;
  ai_insight_persistence_enabled: boolean;
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
  supportEmail?: string | null;
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

export interface CreatedUserResponse {
  userId: number;
  inviteLink?: string;
  inviteToken?: string;
}

export interface AssignableUser {
  id: number;
  fullName: string;
  role: UserRole;
}

// ==================== LEADS ====================
export type LeadSource = 'instagram' | 'telegram' | 'whatsapp' | 'website' | 'phone_call' | 'referral';

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
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
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
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
  tags?: string[];
  notes?: string;
  interestedCourseId?: string | null;
  interestedGroupId?: string | null;
  courseType?: import('@/types/lms').LmsCourseType | null;
  interestLevel?: 'low' | 'medium' | 'high' | null;
}

// ==================== CONTACTS / STUDENTS ====================
export interface Contact {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  notes?: string;
  company?: CompanyRef;
  createdAt: string;
  updatedAt: string;
}

export interface ContactWritePayload {
  fullName?: string;
  phone?: string;
  email?: string;
  notes?: string;
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
  | 'offer_sent'
  | 'negotiation'
  | 'payment_pending'
  | 'won'
  | 'lost';

export type DealPipelineStage =
  | 'new'
  | 'consultation'
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
  contactId?: number | null;
  leadId?: number | null;
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
export type PaymentMethod = string;
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
  leadId?: number | null;
  contactId?: number | null;
  dealId?: number | null;
  retentionCaseId?: number | null;
  assignedTo?: { id: number; fullName: string };
  assignedToId?: number | null;
  contact?: { id: number; fullName: string; phone?: string; email?: string };
  company?: CompanyRef;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskWritePayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  workflowStatus?: TaskWorkflowStatus;
  dueAt?: string | null;
  assignedToId?: number | null;
  leadId?: number | null;
  contactId?: number | null;
  dealId?: number | null;
  retentionCaseId?: number | null;
}

// ==================== COMMUNICATION TIMELINE ====================
export type TimelineEventType = string;

export interface TimelineEvent {
  id: number;
  leadId?: number | null;
  contactId?: number | null;
  dealId?: number | null;
  retentionCaseId?: number | null;
  type: TimelineEventType;
  message: string;
  meta?: Record<string, unknown>;
  lead?: { id: number; fullName: string } | null;
  contact?: { id: number; fullName: string; phone?: string; email?: string } | null;
  deal?: { id: number; contactName?: string | null } | null;
  creatorUserId?: number | null;
  creatorUserName?: string | null;
  company?: CompanyRef;
  createdAt: string;
}

// ==================== WHATSAPP ====================
export type WhatsAppAccountStatus = 'pending' | 'connected' | 'disabled' | 'failed';
export type WhatsAppConversationStatus = 'active' | 'archived' | 'closed';

export interface WhatsAppSettings {
  id: number;
  whatsapp_business_account_id: string;
  phone_number_id: string;
  display_phone_number: string;
  status: WhatsAppAccountStatus;
  last_verified_at?: string | null;
  created_at: string;
  updated_at: string;
  access_token_preview: string;
}

export interface WhatsAppSettingsPayload {
  whatsapp_business_account_id: string;
  phone_number_id: string;
  display_phone_number: string;
  access_token: string;
}

export interface UpdateWhatsAppSettingsPayload {
  whatsapp_business_account_id?: string;
  display_phone_number?: string;
  access_token?: string;
}

export interface WhatsAppConversationStats {
  total: number;
  active: number;
  archived: number;
  closed: number;
  unreadCount: number;
}

export interface WhatsAppMatchedEntity {
  type: 'contact' | 'lead' | 'deal' | 'none';
  entity?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    status?: string;
    value?: number;
    contact_id?: number;
    lead_id?: number;
  };
}

export interface WhatsAppConversationSummary {
  id: number;
  customer_info: {
    phone: string;
    name?: string | null;
  };
  matched_entity: WhatsAppMatchedEntity;
  assigned_user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  } | null;
  unread_count: number;
  status: WhatsAppConversationStatus;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
  whatsapp_account: {
    id: number;
    phone_number_id: string;
    display_phone_number: string;
    status: WhatsAppAccountStatus;
  } | null;
}

export interface WhatsAppConversationDetail {
  id: number;
  customer_info: {
    phone: string;
    name?: string | null;
  };
  matched_entity: WhatsAppMatchedEntity;
  assigned_user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  } | null;
  last_message: {
    id: number;
    body?: string | null;
    message_type: string;
    direction: string;
    status: string;
    created_at: string;
    sent_at?: string | null;
    received_at?: string | null;
  } | null;
  unread_count: number;
  status: WhatsAppConversationStatus;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessageSummary {
  id: number;
  conversation_id: number;
  direction: string;
  message_type: string;
  body?: string | null;
  status: string;
  whatsapp_message_id?: string | null;
  provider_error?: string | null;
  received_at?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppWebhookEventSummary {
  id: number;
  company_id: number;
  whatsapp_account_id?: number | null;
  phone_number_id?: string | null;
  provider_event_id?: string | null;
  event_type: string;
  status: string;
  retry_count: number;
  processed_at?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== RETENTION / RISK ====================
export type IssueType = 'low_attendance' | 'inactive_student' | 'low_homework_completion' | 'low_quiz_participation' | 'payment_risk';
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RetentionCaseStatus = 'open' | 'contacted' | 'monitoring' | 'resolved' | 'escalated';

export interface RetentionCase {
  id: number;
  leadId?: number | null;
  contactId?: number | null;
  dealId?: number | null;
  issueType: IssueType;
  severity: RiskSeverity;
  status: RetentionCaseStatus;
  summary?: string;
  metrics?: Record<string, unknown>;
  lastActivityAt?: string;
  assignedTo?: { id: number; fullName: string };
  assignedToId?: number | null;
  contact?: { id: number; fullName: string; phone?: string; email?: string } | null;
  deal?: { id: number; contactName?: string | null } | null;
  company?: CompanyRef;
  createdAt: string;
  updatedAt: string;
}

export interface RetentionCaseWritePayload {
  leadId?: number | null;
  contactId?: number | null;
  dealId?: number | null;
  issueType?: IssueType;
  severity?: RiskSeverity;
  status?: RetentionCaseStatus;
  summary?: string;
  metrics?: Record<string, unknown>;
  assignedToId?: number | null;
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
  manager?: string;
  course?: string;
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
