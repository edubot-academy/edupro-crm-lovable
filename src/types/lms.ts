// ==================== LMS INTEGRATION TYPES ====================

export type LmsEnrollmentStatus = 'pending_activation' | 'active' | 'paused' | 'completed' | 'cancelled';
export type LmsGroupStatus = 'planned' | 'active' | 'completed' | 'cancelled';
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
  crmContactId: string;
  crmDealId?: string | null;
  crmPaymentId?: string | null;
  student: {
    fullName: string;
    phone: string;
    email?: string | null;
  };
  courseId: string;
  groupId: string;
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
  crmContactId: string;
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
    groupId: string;
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
  [key: string]: unknown;
}
