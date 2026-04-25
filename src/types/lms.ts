// ==================== LMS INTEGRATION TYPES ====================

export type LmsEnrollmentStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type LmsGroupStatus = 'planned' | 'open' | 'active' | 'completed' | 'cancelled';
export type LmsSourceSystem = 'crm' | 'lms';

export type LmsCourseType = 'video' | 'offline' | 'online_live';

export interface LmsCourseListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: 'true' | 'false';
  courseType?: LmsCourseType;
}

export interface LmsGroupListParams {
  courseId?: string;
  status?: LmsGroupStatus;
  page?: number;
  limit?: number;
}

export interface CreateEnrollmentRequest {
  crmLeadId: string;
  crmContactId?: string | null;
  crmDealId?: string | null;
  crmPaymentId?: string | null;
  student: {
    fullName: string;
    phone: string;
    email?: string | null;
  };
  courseId: string;
  courseType?: LmsCourseType;
  groupId?: string | null;
  paymentStatus: 'submitted' | 'confirmed' | 'failed' | 'refunded' | 'overdue';
  enrollmentStatus?: LmsEnrollmentStatus;
  sourceSystem: LmsSourceSystem;
  meta?: {
    submittedByUserId?: string | null;
    submittedByName?: string | null;
    notes?: string | null;
  };
}

export interface ActivateEnrollmentRequest {
  crmLeadId: string;
  crmContactId?: string | null;
  crmPaymentId?: string | null;
  paymentStatus: 'submitted' | 'confirmed' | 'failed' | 'refunded' | 'overdue';
  activatedByUserId?: string | null;
  activatedByName?: string | null;
  notes?: string | null;
}

export interface PauseEnrollmentRequest {
  reason: string;
  pausedByUserId?: string | null;
  pausedByName?: string | null;
}

export interface LmsStudentSummary {
  studentId: string;
  fullName: string;
  email?: string;
  phone?: string;
  enrollments?: {
    enrollmentId: string;
    courseId: string;
    courseName?: string;
    groupId?: string | null;
    groupName?: string;
    status: LmsEnrollmentStatus;
    enrolledAt?: string;
  }[];
  academic?: {
    attendanceRate?: number;
    homeworkCompletionRate?: number;
    quizParticipationRate?: number;
    progressPercent?: number;
    riskLevel?: string;
  };
}

export interface LmsEnrollmentResponse {
  id: string;
  enrollmentId?: string;
  status: LmsEnrollmentStatus;
  message?: string;
  studentId?: string;
  accessActive?: boolean;
  onboarding?: {
    required: boolean;
    setupLink: string | null;
    expiresAt: string | null;
    emailSent: boolean;
  };
  [key: string]: unknown;
}

export interface LmsOnboardingLinkResponse {
  success: boolean;
  message?: string;
  studentId: string;
  onboarding: {
    required: boolean;
    setupLink: string | null;
    expiresAt: string | null;
    emailSent: boolean;
  };
}

export interface LmsIntegrationHistoryItem {
  id: string;
  source: 'outbound' | 'webhook';
  direction: 'crm_to_lms' | 'lms_to_crm';
  createdAt?: string | null;
  requestId?: string | null;
  eventId?: string | null;
  endpoint?: string | null;
  method?: string | null;
  status?: string | null;
  httpStatus?: number | null;
  errorCode?: string | null;
  message?: string | null;
  crmLeadId?: string | null;
  crmContactId?: string | null;
  crmDealId?: string | null;
  crmPaymentId?: string | null;
  lmsStudentId?: string | null;
  lmsEnrollmentId?: string | null;
  enrollmentStatus?: string | null;
}

export interface LmsIntegrationHistoryResponse {
  data: LmsIntegrationHistoryItem[];
  total: number;
  limit: number;
}
