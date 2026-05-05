import { apiClient } from './client';
import type {
  LmsCourse, LmsGroup, Payment, TrialLesson, Task,
  TimelineEvent, RetentionCase, DashboardStats, DashboardStatsQueryParams,
  CrmDashboardStats, EducationDashboardStats,
  FunnelReport, SystemUser, CreatedUserResponse, AssignableUser, Lead, LeadWritePayload, Contact, ContactNote, ContactWritePayload, Deal, CreateDealPayload, UpdateDealPayload, PaginatedResponse,
  TelegramLinkResponse, TelegramStatusResponse,
  InAppNotification, UnreadNotificationsResponse,
  TrialLessonWritePayload,
  TaskWritePayload,
  RetentionCaseWritePayload,
  WhatsAppConversationStats,
  WhatsAppConversationDetail,
  WhatsAppConversationSummary,
  WhatsAppMessageSummary,
  WhatsAppSettings,
  WhatsAppSettingsPayload,
  UpdateWhatsAppSettingsPayload,
  WhatsAppWebhookEventSummary,
} from '@/types';
import type {
  ContactWithStudentMapping,
  LeadWithCourseInterest,
  DealWithCourseMapping,
  PaymentWithEnrollment,
} from '@/types/bridge';
import type {
  LmsCourseListParams, LmsGroupListParams,
  CreateEnrollmentRequest, ActivateEnrollmentRequest, PauseEnrollmentRequest,
  LmsEnrollmentResponse, LmsStudentSummary, LmsIntegrationHistoryResponse, LmsOnboardingLinkResponse,
} from '@/types/lms';

// ==================== USERS ====================
export const usersApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<SystemUser>>('/users', params),
  get: (id: number) => apiClient.get<SystemUser>(`/users/${id}`),
  create: (data: { fullName: string; email: string; role: import('@/types').UserRole }) =>
    apiClient.post<CreatedUserResponse>('/users', data),
  update: (id: number, data: { isActive?: boolean; fullName?: string; email?: string; role?: import('@/types').UserRole }) =>
    apiClient.patch<SystemUser>(`/users/${id}`, data),
  assignables: (params?: { roles?: string; q?: string }) =>
    apiClient.get<AssignableUser[]>('/users/assignables', params as Record<string, string | number | undefined>),
  softDelete: (data: { ids: number[]; anonymize?: boolean }) =>
    apiClient.post<{ success: boolean }>('/users/soft-delete', data),
  hardDelete: (data: { ids: number[]; reassignToUserId?: number }) =>
    apiClient.post<{ success: boolean }>('/users/hard-delete', data),
};

// ==================== PAYMENTS ====================
export const paymentsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Payment>>('/payment', params),
  get: (id: number) => apiClient.get<Payment>(`/payment/${id}`),
  create: (data: { dealId: number; amount: number; method: string; status?: import('@/types').PaymentStatus; paymentStatus?: import('@/types').PaymentStatus; verified?: boolean }) =>
    apiClient.post<Payment>('/payment', data),
  createDeposit: (data: { dealId: number; amount: number; method: string; status?: import('@/types').PaymentStatus; paymentStatus?: import('@/types').PaymentStatus; verified?: boolean }) =>
    apiClient.post<Payment>('/payment/deposit', data),
  update: (id: number, data: { status?: import('@/types').PaymentStatus; paymentStatus?: import('@/types').PaymentStatus }) =>
    apiClient.patch<Payment>(`/payment/${id}`, data),
};

// ==================== LEADS ====================
export const leadsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Lead>>('/leads', params),
  get: (id: number) => apiClient.get<Lead>(`/leads/${id}`),
  create: (data: LeadWritePayload) => apiClient.post<Lead>('/leads', data),
  update: (id: number, data: LeadWritePayload) => apiClient.patch<Lead>(`/leads/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/leads/${id}`),
  checkDuplicates: (data: { phone: string; email?: string }) =>
    apiClient.post<{ hasDuplicate: boolean; duplicateFields?: string[]; existingLead?: Lead }>('/leads/check-duplicates', data),
  listNotes: (leadId: number, params?: { before?: string; limit?: number }) =>
    apiClient.get<ContactNote[]>(`/leads/${leadId}/notes`, params as Record<string, string | number | undefined>),
  addNote: (leadId: number, data: { body: string }) =>
    apiClient.post<ContactNote>(`/leads/${leadId}/notes`, data),
  convertToContact: (id: number) => apiClient.post<{ converted: boolean; alreadyLinked: boolean; reusedExistingContact: boolean; lead: Lead; contact: Contact }>(`/leads/${id}/convert-to-contact`),
};

export const enrollmentsApi = {
  create: (data: { leadId: number; dealId?: number; courseId: string; courseType: 'video' | 'offline' | 'online_live'; groupId?: string; recreateExistingAccount?: boolean; notes?: string }) =>
    apiClient.post<{
      success: boolean;
      enrollmentId: string;
      studentId: string;
      onboardingLink?: string;
      status: string;
      message: string;
      requiresApproval: boolean;
    }>('/enrollments', data),
  approve: (id: number, data?: { notes?: string }) =>
    apiClient.post<{
      success: boolean;
      enrollmentId: string;
      status: string;
      message: string;
    }>(`/enrollments/${id}/approve`, data ?? {}),
  getPending: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<{
      pending: Array<{
        enrollmentId: string;
        crmLeadId: string;
        courseId: string;
        courseType: string;
        groupId?: string;
        student: {
          fullName: string;
          email: string;
          phone: string;
        };
        createdAt: string;
        requestId: string;
      }>;
      total: number;
      limit: number;
      offset: number;
    }>('/enrollments/pending', params as Record<string, string | number | undefined>),
  getHistory: (params?: { status?: string; limit?: number; offset?: number }) =>
    apiClient.get<{
      enrollments: Array<{
        id: string;
        type: string;
        direction: string;
        createdAt: string;
        enrollmentId: string;
        crmLeadId: string;
        courseId: string;
        courseType: string;
        status: string;
        endpoint: string;
        method: string;
        message: string;
        student: {
          fullName: string;
          email: string;
        };
      }>;
      total: number;
      limit: number;
      offset: number;
      status: string;
    }>('/enrollments/history', params as Record<string, string | number | undefined>),
};

// ==================== CONTACT (Compact CRUD) ====================
export const contactApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Contact>>('/contact', params),
  get: (id: number) => apiClient.get<Contact>(`/contact/${id}`),
  create: (data: ContactWritePayload) => apiClient.post<Contact>('/contact', data),
  update: (id: number, data: ContactWritePayload) => apiClient.patch<Contact>(`/contact/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/contact/${id}`),
};

// ==================== LEAD AUDIT ====================
export const leadAuditApi = {
  getLogs: (leadId: number) =>
    apiClient.get<unknown[]>(`/audit/leads/${leadId}/logs`),
  addLog: (leadId: number, data: { note?: string; followUpDate?: string }) =>
    apiClient.post<unknown>(`/audit/leads/${leadId}/log`, data),
};

// ==================== DEALS ====================
export const dealsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Deal>>('/deals', params),
  get: (id: number) => apiClient.get<Deal>(`/deals/${id}`),
  create: (data: CreateDealPayload) => apiClient.post<Deal>('/deals', data),
  update: (id: number, data: UpdateDealPayload) => apiClient.patch<Deal>(`/deals/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/deals/${id}`),
};

// ==================== BRIDGE (LMS Integration) ====================
export const bridgeApi = {
  getContactBridgeData: (contactId: number) =>
    apiClient.get<ContactWithStudentMapping>(`/bridge/contacts/${contactId}`),
  getLeadBridgeData: (leadId: number) =>
    apiClient.get<LeadWithCourseInterest>(`/bridge/leads/${leadId}`),
  getDealBridgeData: (dealId: number) =>
    apiClient.get<DealWithCourseMapping>(`/bridge/deals/${dealId}`),
  updateDealLmsMapping: (dealId: number, data: { lmsCourseId?: string; courseType?: string; lmsGroupId?: string; courseNameSnapshot?: string; groupNameSnapshot?: string }) =>
    apiClient.put<DealWithCourseMapping>(`/bridge/deals/${dealId}/mapping`, data),
  getPaymentBridgeData: (paymentId: number) =>
    apiClient.get<PaymentWithEnrollment>(`/bridge/payments/${paymentId}`),
};

// ==================== TRIAL LESSONS ====================
export const trialLessonsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<TrialLesson>>('/trial-lessons', params),
  get: (id: number) => apiClient.get<TrialLesson>(`/trial-lessons/${id}`),
  create: (data: TrialLessonWritePayload) =>
    apiClient.post<TrialLesson>('/trial-lessons', data),
  update: (id: number, data: TrialLessonWritePayload) =>
    apiClient.patch<TrialLesson>(`/trial-lessons/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/trial-lessons/${id}`),
};

// ==================== TASKS ====================
export const tasksApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Task>>('/tasks', params),
  get: (id: number) => apiClient.get<Task>(`/tasks/${id}`),
  create: (data: TaskWritePayload & { title: string }) => apiClient.post<Task>('/tasks', data),
  update: (id: number, data: TaskWritePayload) => apiClient.patch<Task>(`/tasks/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/tasks/${id}`),
};

// ==================== COMMUNICATION TIMELINE ====================
export const timelineApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<TimelineEvent>>('/communication-timeline', params),
  add: (data: { type: string; message: string; leadId?: number; contactId?: number; dealId?: number; retentionCaseId?: number; meta?: Record<string, unknown> }) =>
    apiClient.post<TimelineEvent>('/communication-timeline', data),
};

export const whatsappApi = {
  getSettings: () =>
    apiClient.get<WhatsAppSettings | { message: string }>('/whatsapp/settings'),
  createSettings: (data: WhatsAppSettingsPayload) =>
    apiClient.post<{ message: string; account: WhatsAppSettings }>('/whatsapp/settings', data),
  updateSettings: (data: UpdateWhatsAppSettingsPayload) =>
    apiClient.patch<{ message: string; account: WhatsAppSettings }>('/whatsapp/settings', data),
  testConnection: () =>
    apiClient.post<{ message: string }>('/whatsapp/settings/test'),
  disableSettings: () =>
    apiClient.post<{ message: string }>('/whatsapp/settings/disable'),
  getStats: () =>
    apiClient.get<{ message: string; stats: WhatsAppConversationStats }>('/whatsapp/stats'),
  getFailedWebhookEvents: (params?: { limit?: number }) =>
    apiClient.get<{ message: string; events: WhatsAppWebhookEventSummary[] }>(
      '/whatsapp/webhook-events/failed',
      params as Record<string, string | number | undefined>,
    ),
  getConversations: (params?: {
    limit?: number;
    offset?: number;
    matched?: boolean;
    unreadOnly?: boolean;
    status?: 'active' | 'archived' | 'closed';
    search?: string;
  }) =>
    apiClient.get<{
      conversations: WhatsAppConversationSummary[];
      stats: WhatsAppConversationStats;
      pagination: { limit: number; offset: number; total: number };
    }>('/whatsapp/conversations', params as Record<string, string | number | undefined>),
  getConversation: (conversationId: number) =>
    apiClient.get<WhatsAppConversationDetail>(`/whatsapp/conversations/${conversationId}`),
  getConversationMessages: (conversationId: number, params?: { limit?: number; offset?: number }) =>
    apiClient.get<{
      conversation: WhatsAppConversationSummary;
      messages: WhatsAppMessageSummary[];
      pagination: { limit: number; offset: number };
    }>(`/whatsapp/conversations/${conversationId}/messages`, params as Record<string, string | number | undefined>),
  sendConversationMessage: (conversationId: number, data: { body: string; message_type?: 'text' }) =>
    apiClient.post<{ message: string; messageId: number; whatsappMessageId?: string }>(`/whatsapp/conversations/${conversationId}/send`, data),
  markConversationAsRead: (conversationId: number) =>
    apiClient.post<{ message: string }>(`/whatsapp/conversations/${conversationId}/read`),
  linkConversation: (conversationId: number, data: { contactId?: number; leadId?: number; dealId?: number }) =>
    apiClient.post<{ message: string; conversation: WhatsAppConversationSummary }>(`/whatsapp/conversations/${conversationId}/link`, data),
  retryWebhookEvent: (eventId: number) =>
    apiClient.post<{ message: string }>(`/whatsapp/webhook-events/${eventId}/retry`),
};

// ==================== RETENTION CASES ====================
export const retentionApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<RetentionCase>>('/retention-cases', params),
  get: (id: number) => apiClient.get<RetentionCase>(`/retention-cases/${id}`),
  create: (data: RetentionCaseWritePayload & { issueType: import('@/types').IssueType; severity: import('@/types').RiskSeverity; summary: string }) =>
    apiClient.post<RetentionCase>('/retention-cases', data),
  update: (id: number, data: RetentionCaseWritePayload) =>
    apiClient.patch<RetentionCase>(`/retention-cases/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/retention-cases/${id}`),
  contact: (id: number) =>
    apiClient.patch<RetentionCase>(`/retention-cases/${id}/contact`),
  resolve: (id: number) =>
    apiClient.patch<RetentionCase>(`/retention-cases/${id}/resolve`),
  escalate: (id: number) =>
    apiClient.patch<RetentionCase>(`/retention-cases/${id}/escalate`),
};

// ==================== NOTIFICATIONS (Telegram) ====================
export const notificationsApi = {
  /** Get Telegram linking URL for current user */
  getTelegramLink: () =>
    apiClient.get<TelegramLinkResponse>('/notifications/telegram/link'),
  /** Get Telegram link status */
  getTelegramStatus: () =>
    apiClient.get<TelegramStatusResponse>('/notifications/telegram/status'),
  /** Send test Telegram message */
  sendTestMessage: () =>
    apiClient.post<void>('/notifications/telegram/test'),
  listInApp: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<InAppNotification>>('/notifications/in-app', params),
  getUnreadCount: () =>
    apiClient.get<UnreadNotificationsResponse>('/notifications/in-app/unread-count'),
  markAsRead: (id: number) =>
    apiClient.patch<{ success: boolean }>(`/notifications/in-app/${id}/read`),
  markAllAsRead: () =>
    apiClient.patch<{ success: boolean }>('/notifications/in-app/read-all'),
};

// ==================== DASHBOARD ====================
export const dashboardApi = {
  getStats: (params?: DashboardStatsQueryParams) =>
    apiClient.get<DashboardStats>('/dashboard/stats', params as Record<string, string | number | undefined>),
  getCrmStats: (params?: DashboardStatsQueryParams) =>
    apiClient.get<CrmDashboardStats>('/dashboard/crm-stats', params as Record<string, string | number | undefined>),
  getEducationStats: (params?: DashboardStatsQueryParams) =>
    apiClient.get<EducationDashboardStats>('/dashboard/education-stats', params as Record<string, string | number | undefined>),
};

export const reportsApi = {
  getStats: (params?: DashboardStatsQueryParams) =>
    apiClient.get<DashboardStats>('/reports/stats', params as Record<string, string | number | undefined>),
  getFunnel: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<FunnelReport>('/reports/funnel', params),
  getPaymentReports: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<{
      totalAmount: number;
      totalCount: number;
      byStatus: {
        confirmed: { count: number; amount: number };
        submitted: { count: number; amount: number };
        failed: { count: number; amount: number };
      };
      byMethod: Array<{ method: string; count: number; amount: number }>;
      byCourse: Array<{ course: string; count: number; amount: number }>;
      byManager: Array<{ manager: string; count: number; amount: number }>;
    }>('/reports/payments', params),
  getRevenueReports: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<{
      totalRevenue: number;
      paymentCount: number;
      averagePayment: number;
      trend: Array<{ date: string; amount: number }>;
    }>('/reports/revenue', params),
};

// ==================== PROFILE ====================
export const profileApi = {
  get: () => apiClient.get<SystemUser>('/users/me'),
  update: (data: { fullName?: string; email?: string }) =>
    apiClient.patch<SystemUser>('/users/me', data),
};


// ==================== LMS INTEGRATION ====================
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL ? new URL(import.meta.env.VITE_API_BASE_URL).origin : window.location.origin;
const SHOULD_SEND_LMS_REQUEST_ID = API_ORIGIN === window.location.origin;

function lmsRequestOptions(companyId?: string, idempotencyKey?: string) {
  return {
    extraHeaders: {
      ...(companyId ? { 'X-Company-Id': companyId } : {}),
      ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
    },
    getAttemptHeaders: SHOULD_SEND_LMS_REQUEST_ID
      ? () => ({
        'X-Request-Id': crypto.randomUUID(),
      })
      : undefined,
  };
}

export const lmsApi = {
  getCourses: (params?: LmsCourseListParams, companyId?: string) =>
    apiClient.get<PaginatedResponse<LmsCourse>>('/integrations/lms/courses', params as Record<string, string | number | undefined>, lmsRequestOptions(companyId)),

  getGroups: (params?: LmsGroupListParams, companyId?: string) =>
    apiClient.get<PaginatedResponse<LmsGroup>>('/integrations/lms/groups', params as Record<string, string | number | undefined>, lmsRequestOptions(companyId)),

  createEnrollment: (data: CreateEnrollmentRequest, options?: { companyId?: string; idempotencyKey?: string }) =>
    apiClient.post<LmsEnrollmentResponse>('/integrations/lms/enrollments', data, lmsRequestOptions(options?.companyId, options?.idempotencyKey)),

  activateEnrollment: (enrollmentId: string, data: ActivateEnrollmentRequest, options?: { companyId?: string; idempotencyKey?: string }) =>
    apiClient.patch<LmsEnrollmentResponse>(`/integrations/lms/enrollments/${enrollmentId}/activate`, data, lmsRequestOptions(options?.companyId, options?.idempotencyKey)),

  pauseEnrollment: (enrollmentId: string, data: PauseEnrollmentRequest, options?: { companyId?: string; idempotencyKey?: string }) =>
    apiClient.patch<LmsEnrollmentResponse>(`/integrations/lms/enrollments/${enrollmentId}/pause`, data, lmsRequestOptions(options?.companyId, options?.idempotencyKey)),

  getStudentSummary: (studentId: string, companyId?: string) =>
    apiClient.get<LmsStudentSummary>(`/integrations/lms/students/${studentId}/summary`, undefined, lmsRequestOptions(companyId)),

  createStudentOnboardingLink: (studentId: string, companyId?: string) =>
    apiClient.post<LmsOnboardingLinkResponse>(`/integrations/lms/students/${studentId}/onboarding-link`, {}, lmsRequestOptions(companyId)),
};

// ==================== INTEGRATION ADMIN ====================
export const lmsAdminApi = {
  riskScan: (companyId?: string) => apiClient.post<Record<string, unknown>>('/integrations/lms/admin/risk-scan', undefined, lmsRequestOptions(companyId)),
  testRiskAlert: (companyId?: string) => apiClient.post<Record<string, unknown>>('/integrations/lms/admin/test-risk-alert', undefined, lmsRequestOptions(companyId)),
  dispatchWebhooks: (companyId?: string) => apiClient.post<Record<string, unknown>>('/integrations/lms/admin/dispatch-webhooks', undefined, lmsRequestOptions(companyId)),
  health: (companyId?: string) => apiClient.get<Record<string, unknown>>('/integrations/lms/admin/health', undefined, lmsRequestOptions(companyId)),
  history: (params?: Record<string, string | number | undefined>, companyId?: string) =>
    apiClient.get<LmsIntegrationHistoryResponse>('/integrations/lms/admin/history', params, lmsRequestOptions(companyId)),
};
