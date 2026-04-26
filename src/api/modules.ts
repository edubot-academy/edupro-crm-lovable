import { apiClient } from './client';
import type {
  LmsCourse, LmsGroup, Payment, TrialLesson, Task,
  TimelineEvent, RetentionCase, DashboardStats, DashboardStatsQueryParams,
  CrmDashboardStats, EducationDashboardStats,
  FunnelReport, SystemUser, CreatedUserResponse, AssignableUser, Company, Lead, Contact, ContactNote, Deal, PaginatedResponse,
  TelegramLinkResponse, TelegramStatusResponse,
  InAppNotification, UnreadNotificationsResponse,
} from '@/types';
import type {
  ContactWithStudentMapping,
  LeadWithCourseInterest,
  DealWithCourseMapping,
  PaymentWithEnrollment,
  RetentionCaseWithLmsData
} from '@/types/bridge';
import type {
  LmsCourseListParams, LmsGroupListParams,
  CreateEnrollmentRequest, ActivateEnrollmentRequest, PauseEnrollmentRequest,
  LmsEnrollmentResponse, LmsStudentSummary, LmsIntegrationHistoryResponse, LmsOnboardingLinkResponse,
} from '@/types/lms';

// ==================== COMPANIES ====================
export const companiesApi = {
  list: () => apiClient.get<Company[]>('/api/companies'),
  get: (id: number) => apiClient.get<Company>(`/api/companies/${id}`),
  create: (data: { name: string; industry: 'education' | 'retail' }) => apiClient.post<Company>('/api/companies', data),
};

// ==================== USERS ====================
export const usersApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<SystemUser>>('/api/users', params),
  get: (id: number) => apiClient.get<SystemUser>(`/api/users/${id}`),
  create: (data: { fullName: string; email: string; role: import('@/types').UserRole }) =>
    apiClient.post<CreatedUserResponse>('/api/users', data),
  update: (id: number, data: { isActive?: boolean; fullName?: string; email?: string; role?: import('@/types').UserRole }) =>
    apiClient.patch<SystemUser>(`/api/users/${id}`, data),
  assignables: (params?: { roles?: string; q?: string }) =>
    apiClient.get<AssignableUser[]>('/api/users/assignables', params as Record<string, string | number | undefined>),
  softDelete: (data: { ids: number[]; anonymize?: boolean }) =>
    apiClient.post<{ success: boolean }>('/api/users/soft-delete', data),
  hardDelete: (data: { ids: number[]; reassignToUserId?: number }) =>
    apiClient.post<{ success: boolean }>('/api/users/hard-delete', data),
};

// ==================== PAYMENTS ====================
export const paymentsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Payment>>('/api/payment', params),
  get: (id: number) => apiClient.get<Payment>(`/api/payment/${id}`),
  create: (data: { dealId: number; amount: number; method: import('@/types').PaymentMethod; status?: import('@/types').PaymentStatus; paymentStatus?: import('@/types').PaymentStatus; verified?: boolean }) =>
    apiClient.post<Payment>('/api/payment', data),
  createDeposit: (data: { dealId: number; amount: number; method: import('@/types').PaymentMethod; status?: import('@/types').PaymentStatus; paymentStatus?: import('@/types').PaymentStatus; verified?: boolean }) =>
    apiClient.post<Payment>('/api/payment/deposit', data),
  update: (id: number, data: { status?: import('@/types').PaymentStatus; paymentStatus?: import('@/types').PaymentStatus }) =>
    apiClient.patch<Payment>(`/api/payment/${id}`, data),
};

// ==================== LEADS ====================
export const leadsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Lead>>('/api/leads', params),
  get: (id: number) => apiClient.get<Lead>(`/api/leads/${id}`),
  create: (data: Partial<Lead>) => apiClient.post<Lead>('/api/leads', data),
  update: (id: number, data: Partial<Lead>) => apiClient.patch<Lead>(`/api/leads/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/api/leads/${id}`),
  checkDuplicates: (data: { phone: string; email?: string }) =>
    apiClient.post<{ hasDuplicate: boolean; duplicateFields?: string[]; existingLead?: Lead }>('/api/leads/check-duplicates', data),
  listNotes: (leadId: number, params?: { before?: string; limit?: number }) =>
    apiClient.get<ContactNote[]>(`/api/leads/${leadId}/notes`, params as Record<string, string | number | undefined>),
  addNote: (leadId: number, data: { body: string }) =>
    apiClient.post<ContactNote>(`/api/leads/${leadId}/notes`, data),
  convertToContact: (id: number) => apiClient.post<{ converted: boolean; alreadyLinked: boolean; reusedExistingContact: boolean; lead: Lead; contact: Contact }>(`/api/leads/${id}/convert-to-contact`),
};

export const enrollmentsApi = {
  create: (data: { leadId: number; courseId: string; courseType: 'video' | 'offline' | 'online_live'; groupId?: string; recreateExistingAccount?: boolean }) =>
    apiClient.post<{
      success: boolean;
      enrollmentId: string;
      studentId: string;
      onboardingLink?: string;
      status: string;
      message: string;
      requiresApproval: boolean;
    }>('/api/enrollments', data),
  approve: (id: number, data?: { notes?: string }) =>
    apiClient.post<{
      success: boolean;
      enrollmentId: string;
      status: string;
      message: string;
    }>(`/api/enrollments/${id}/approve`, data ?? {}),
  getPending: () =>
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
    }>('/api/enrollments/pending'),
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
    }>('/api/enrollments/history', params as Record<string, string | number | undefined>),
};

// ==================== LEGACY CONTACTS ====================
export const legacyContactsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Contact>>('/api/legacy-contacts', params),
  get: (id: number) => apiClient.get<Contact>(`/api/legacy-contacts/${id}`),
  /** Public lead capture (no auth required) */
  create: (data: Partial<Contact> & { message?: string; captchaToken?: string; consent?: boolean; utmSource?: string; utmMedium?: string; utmCampaign?: string; courseType?: string; courseName?: string }) =>
    apiClient.post<Contact>('/api/legacy-contacts', data),
  /** Authenticated manual contact creation */
  createManual: (data: Partial<Contact>) =>
    apiClient.post<Contact>('/api/legacy-contacts/manual', data),
  update: (id: number, data: Partial<Contact>) => apiClient.patch<Contact>(`/api/legacy-contacts/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/api/legacy-contacts/${id}`),
  /** Assign/unassign contact owner */
  assign: (data: { contactId: number; assigneeUserId?: number | null }) =>
    apiClient.post<Contact>('/api/legacy-contacts/assign', data),
  /** Quick self-assignment */
  selfAssign: (id: number) => apiClient.patch<Contact>(`/api/legacy-contacts/${id}/self-assign`),
  /** Soft-delete contacts in bulk */
  bulkDelete: (data: { ids: number[] }) =>
    apiClient.post<{ success: boolean }>('/api/legacy-contacts/bulk-delete', data),
  /** Hard purge contacts (superadmin) */
  purge: (data: { ids: number[] }) =>
    apiClient.post<{ success: boolean }>('/api/legacy-contacts/purge', data),
  /** Delete all test contacts */
  deleteTests: () =>
    apiClient.post<{ success: boolean }>('/api/legacy-contacts/delete-tests'),
  /** Create DEPOSIT payment for contact */
  deposit: (id: number, data: Record<string, unknown>) =>
    apiClient.post<Payment>(`/api/legacy-contacts/${id}/deposit`, data),
  /** Create ENROLLMENT payment for contact */
  enroll: (id: number, data: Record<string, unknown>) =>
    apiClient.post<Payment>(`/api/legacy-contacts/${id}/enroll`, data),
};

// ==================== CONTACT (Compact CRUD) ====================
export const contactApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Contact>>('/api/contact', params),
  get: (id: number) => apiClient.get<Contact>(`/api/contact/${id}`),
  create: (data: Partial<Contact>) => apiClient.post<Contact>('/api/contact', data),
  update: (id: number, data: Partial<Contact>) => apiClient.patch<Contact>(`/api/contact/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/api/contact/${id}`),
};

// ==================== LEAD AUDIT ====================
export const leadAuditApi = {
  getLogs: (leadId: number) =>
    apiClient.get<unknown[]>(`/api/audit/leads/${leadId}/logs`),
  addLog: (leadId: number, data: { note?: string; followUpDate?: string }) =>
    apiClient.post<unknown>(`/api/audit/leads/${leadId}/log`, data),
};

// ==================== DEALS ====================
export const dealsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Deal>>('/api/deals', params),
  get: (id: number) => apiClient.get<Deal>(`/api/deals/${id}`),
  create: (data: Partial<Deal>) => apiClient.post<Deal>('/api/deals', data),
  update: (id: number, data: Partial<Deal>) => apiClient.patch<Deal>(`/api/deals/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/api/deals/${id}`),
};

// ==================== BRIDGE (LMS Integration) ====================
export const bridgeApi = {
  getContactBridgeData: (contactId: number) =>
    apiClient.get<ContactWithStudentMapping>(`/api/bridge/contacts/${contactId}`),
  getLeadBridgeData: (leadId: number) =>
    apiClient.get<LeadWithCourseInterest>(`/api/bridge/leads/${leadId}`),
  getDealBridgeData: (dealId: number) =>
    apiClient.get<DealWithCourseMapping>(`/api/bridge/deals/${dealId}`),
  updateDealLmsMapping: (dealId: number, data: { lmsCourseId?: string; courseType?: string; lmsGroupId?: string; courseNameSnapshot?: string; groupNameSnapshot?: string }) =>
    apiClient.put<DealWithCourseMapping>(`/api/bridge/deals/${dealId}/mapping`, data),
  getPaymentBridgeData: (paymentId: number) =>
    apiClient.get<PaymentWithEnrollment>(`/api/bridge/payments/${paymentId}`),
};

// ==================== TRIAL LESSONS ====================
export const trialLessonsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<TrialLesson>>('/api/trial-lessons', params),
  get: (id: number) => apiClient.get<TrialLesson>(`/api/trial-lessons/${id}`),
  create: (data: { leadId?: number; contactId?: number; dealId?: number; scheduledAt: string; result?: string; notes?: string }) =>
    apiClient.post<TrialLesson>('/api/trial-lessons', data),
  update: (id: number, data: Partial<TrialLesson>) =>
    apiClient.patch<TrialLesson>(`/api/trial-lessons/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/api/trial-lessons/${id}`),
};

// ==================== TASKS ====================
export const tasksApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Task>>('/api/tasks', params),
  get: (id: number) => apiClient.get<Task>(`/api/tasks/${id}`),
  create: (data: Partial<Task> & { title: string }) => apiClient.post<Task>('/api/tasks', data),
  update: (id: number, data: Partial<Task>) => apiClient.patch<Task>(`/api/tasks/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/api/tasks/${id}`),
};

// ==================== COMMUNICATION TIMELINE ====================
export const timelineApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<TimelineEvent>>('/api/communication-timeline', params),
  add: (data: { type: string; message: string; leadId?: number; contactId?: number; dealId?: number; retentionCaseId?: number; meta?: Record<string, unknown> }) =>
    apiClient.post<TimelineEvent>('/api/communication-timeline', data),
};

// ==================== RETENTION CASES ====================
export const retentionApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<RetentionCase>>('/api/retention-cases', params),
  get: (id: number) => apiClient.get<RetentionCase>(`/api/retention-cases/${id}`),
  create: (data: { issueType: import('@/types').IssueType; severity: import('@/types').RiskSeverity; summary: string; leadId?: number; contactId?: number; dealId?: number; status?: string; metrics?: Record<string, unknown>; assignedToId?: number }) =>
    apiClient.post<RetentionCase>('/api/retention-cases', data),
  update: (id: number, data: { leadId?: number; contactId?: number; dealId?: number; issueType?: import('@/types').IssueType; severity?: import('@/types').RiskSeverity; status?: string; summary?: string; metrics?: Record<string, unknown>; assignedToId?: number }) =>
    apiClient.patch<RetentionCase>(`/api/retention-cases/${id}`, data),
  delete: (id: number) => apiClient.delete<{ success: boolean }>(`/api/retention-cases/${id}`),
  contact: (id: number) =>
    apiClient.patch<RetentionCase>(`/api/retention-cases/${id}/contact`),
  resolve: (id: number) =>
    apiClient.patch<RetentionCase>(`/api/retention-cases/${id}/resolve`),
  escalate: (id: number) =>
    apiClient.patch<RetentionCase>(`/api/retention-cases/${id}/escalate`),
};

// ==================== NOTIFICATIONS (Telegram) ====================
export const notificationsApi = {
  /** Get Telegram linking URL for current user */
  getTelegramLink: () =>
    apiClient.get<TelegramLinkResponse>('/api/notifications/telegram/link'),
  /** Get Telegram link status */
  getTelegramStatus: () =>
    apiClient.get<TelegramStatusResponse>('/api/notifications/telegram/status'),
  /** Send test Telegram message */
  sendTestMessage: () =>
    apiClient.post<void>('/api/notifications/telegram/test'),
  listInApp: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<InAppNotification>>('/api/notifications/in-app', params),
  getUnreadCount: () =>
    apiClient.get<UnreadNotificationsResponse>('/api/notifications/in-app/unread-count'),
  markAsRead: (id: number) =>
    apiClient.patch<{ success: boolean }>(`/api/notifications/in-app/${id}/read`),
  markAllAsRead: () =>
    apiClient.patch<{ success: boolean }>('/api/notifications/in-app/read-all'),
};

// ==================== DASHBOARD ====================
export const dashboardApi = {
  getStats: (params?: DashboardStatsQueryParams) =>
    apiClient.get<DashboardStats>('/api/dashboard/stats', params as Record<string, string | number | undefined>),
  getCrmStats: (params?: DashboardStatsQueryParams) =>
    apiClient.get<CrmDashboardStats>('/api/dashboard/crm-stats', params as Record<string, string | number | undefined>),
  getEducationStats: (params?: DashboardStatsQueryParams) =>
    apiClient.get<EducationDashboardStats>('/api/dashboard/education-stats', params as Record<string, string | number | undefined>),
};

export const reportsApi = {
  getStats: (params?: DashboardStatsQueryParams) =>
    apiClient.get<DashboardStats>('/api/reports/stats', params as Record<string, string | number | undefined>),
  getFunnel: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<FunnelReport>('/api/reports/funnel', params),
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
    }>('/api/reports/payments', params),
  getRevenueReports: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<{
      totalRevenue: number;
      paymentCount: number;
      averagePayment: number;
      trend: Array<{ date: string; amount: number }>;
    }>('/api/reports/revenue', params),
};

// ==================== PROFILE ====================
export const profileApi = {
  get: () => apiClient.get<SystemUser>('/api/users/me'),
  update: (data: { fullName?: string; email?: string }) =>
    apiClient.patch<SystemUser>('/api/users/me', data),
};


// ==================== LMS INTEGRATION ====================
const DEFAULT_LMS_COMPANY_ID = import.meta.env.VITE_LMS_COMPANY_ID || 'default';
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL ? new URL(import.meta.env.VITE_API_BASE_URL).origin : window.location.origin;
const SHOULD_SEND_LMS_REQUEST_ID = API_ORIGIN === window.location.origin;

function lmsRequestOptions(companyId?: string, idempotencyKey?: string) {
  return {
    extraHeaders: {
      'X-Company-Id': companyId || DEFAULT_LMS_COMPANY_ID,
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
    apiClient.get<PaginatedResponse<LmsCourse>>('/api/integrations/lms/courses', params as Record<string, string | number | undefined>, lmsRequestOptions(companyId)),

  getGroups: (params?: LmsGroupListParams, companyId?: string) =>
    apiClient.get<PaginatedResponse<LmsGroup>>('/api/integrations/lms/groups', params as Record<string, string | number | undefined>, lmsRequestOptions(companyId)),

  createEnrollment: (data: CreateEnrollmentRequest, options?: { companyId?: string; idempotencyKey?: string }) =>
    apiClient.post<LmsEnrollmentResponse>('/api/integrations/lms/enrollments', data, lmsRequestOptions(options?.companyId, options?.idempotencyKey)),

  activateEnrollment: (enrollmentId: string, data: ActivateEnrollmentRequest, options?: { companyId?: string; idempotencyKey?: string }) =>
    apiClient.patch<LmsEnrollmentResponse>(`/api/integrations/lms/enrollments/${enrollmentId}/activate`, data, lmsRequestOptions(options?.companyId, options?.idempotencyKey)),

  pauseEnrollment: (enrollmentId: string, data: PauseEnrollmentRequest, options?: { companyId?: string; idempotencyKey?: string }) =>
    apiClient.patch<LmsEnrollmentResponse>(`/api/integrations/lms/enrollments/${enrollmentId}/pause`, data, lmsRequestOptions(options?.companyId, options?.idempotencyKey)),

  getStudentSummary: (studentId: string, companyId?: string) =>
    apiClient.get<LmsStudentSummary>(`/api/integrations/lms/students/${studentId}/summary`, undefined, lmsRequestOptions(companyId)),

  createStudentOnboardingLink: (studentId: string, companyId?: string) =>
    apiClient.post<LmsOnboardingLinkResponse>(`/api/integrations/lms/students/${studentId}/onboarding-link`, {}, lmsRequestOptions(companyId)),
};

// ==================== INTEGRATION ADMIN ====================
export const lmsAdminApi = {
  riskScan: (companyId?: string) => apiClient.post<Record<string, unknown>>('/api/integrations/lms/admin/risk-scan', undefined, lmsRequestOptions(companyId)),
  testRiskAlert: (companyId?: string) => apiClient.post<Record<string, unknown>>('/api/integrations/lms/admin/test-risk-alert', undefined, lmsRequestOptions(companyId)),
  dispatchWebhooks: (companyId?: string) => apiClient.post<Record<string, unknown>>('/api/integrations/lms/admin/dispatch-webhooks', undefined, lmsRequestOptions(companyId)),
  health: (companyId?: string) => apiClient.get<Record<string, unknown>>('/api/integrations/lms/admin/health', undefined, lmsRequestOptions(companyId)),
  history: (params?: Record<string, string | number | undefined>, companyId?: string) =>
    apiClient.get<LmsIntegrationHistoryResponse>('/api/integrations/lms/admin/history', params, lmsRequestOptions(companyId)),
};
