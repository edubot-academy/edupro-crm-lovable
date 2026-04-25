/**
 * Bridge-Enriched Types
 *
 * These types represent bridge-only enrichment payloads from dedicated bridge endpoints.
 * They should only be used when LMS bridge is enabled and the user has appropriate permissions.
 *
 * IMPORTANT: CRM pages should use CRM-native types by default.
 * Bridge-enriched types should only be used in:
 * - LMS-specific components (e.g., LeadCourseInterest, ContactStudentMapping, DealCourseMapping)
 * - Admin/integration views where bridge data is explicitly needed
 *
 * Bridge Contract:
 * - Bridge types are for enrichment only, not for storage
 * - Bridge fields should be optional and nullable
 * - Bridge types should not be used in default API responses
 * - Bridge types should only be used when LMS bridge feature flag is enabled
 * - Bridge types should stay limited to the explicit bridge payload
 */

// ==================== LEAD BRIDGE TYPES ====================

/**
 * Lead with LMS course interest data
 * Used by LeadCourseInterest component when LMS bridge is enabled
 */
export interface LeadWithCourseInterest {
  interestedCourseId?: string;
  interestedGroupId?: string;
  syncStatus?: string;
  lastSyncedAt?: string;
}

// ==================== CONTACT BRIDGE TYPES ====================

/**
 * Contact with LMS student mapping data
 * Used by ContactStudentMapping component when LMS bridge is enabled
 */
export interface ContactWithStudentMapping {
  externalStudentId?: string;
  lmsStudentId?: string;
  syncStatus?: string;
  lastSyncedAt?: string;
}

// ==================== DEAL BRIDGE TYPES ====================

/**
 * Deal with LMS course/group mapping data
 * Used by DealCourseMapping component when LMS bridge is enabled
 */
export interface DealWithCourseMapping {
  lmsCourseId?: string;
  lmsGroupId?: string;
  courseType?: import('./lms').LmsCourseType;
  courseNameSnapshot?: string;
  groupNameSnapshot?: string;
  syncStatus?: string;
  lastSyncedAt?: string;
}

// ==================== PAYMENT BRIDGE TYPES ====================

/**
 * Payment with LMS enrollment data
 * Used by LMS enrollment features when LMS bridge is enabled
 */
export interface PaymentWithEnrollment {
  lmsEnrollmentId?: string;
  enrollmentRequestId?: number;
  syncStatus?: string;
  syncError?: string;
  syncMetadata?: Record<string, unknown>;
  lastSyncedAt?: string;
}

/**
 * Deal payment summary with LMS bridge data
 */
export interface DealPaymentSummaryWithBridge {
  dealTotal: number;
  confirmedPaid: number;
  submittedPending: number;
  refundedTotal: number;
  remaining: number;
  depositPaid: number;
  lastPaymentKind?: 'regular' | 'deposit' | null;
  lastPaymentStatus?: 'submitted' | 'confirmed' | 'failed' | 'refunded' | 'overdue' | null;
  lmsCourseId?: string;
  lmsGroupId?: string;
  courseType?: import('./lms').LmsCourseType;
  courseNameSnapshot?: string;
  groupNameSnapshot?: string;
  syncStatus?: string;
  lastSyncedAt?: string;
}

// ==================== RETENTION BRIDGE TYPES ====================

/**
 * Retention case with LMS-specific fields
 * Used when LMS bridge is enabled for education retention
 */
export interface RetentionCaseWithLmsData {
  lmsStudentId?: string;
  lmsEnrollmentId?: string;
  lmsCourseId?: string;
  lmsGroupId?: string;
}
