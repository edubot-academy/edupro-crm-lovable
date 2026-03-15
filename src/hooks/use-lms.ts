import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lmsApi } from '@/api/modules';
import type { ApiError } from '@/types';
import type {
  LmsCourseListParams, LmsGroupListParams,
  CreateEnrollmentRequest, ActivateEnrollmentRequest, PauseEnrollmentRequest,
} from '@/types/lms';
import { useToast } from '@/hooks/use-toast';

function invalidateLmsQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['lms-courses'] }),
    queryClient.invalidateQueries({ queryKey: ['lms-groups'] }),
    queryClient.invalidateQueries({ queryKey: ['lms-student-summary'] }),
  ]);
}

function formatLmsError(err: unknown, fallback: string) {
  const apiError = (typeof err === 'object' && err !== null ? err as ApiError : null);
  const message = apiError?.message || fallback;
  const requestId = apiError?.requestId;
  return {
    title: requestId ? `${message} [Request ID: ${requestId}]` : message,
    requestId,
  };
}

// ==================== QUERIES (with retry) ====================

export function useLmsCourses(params?: LmsCourseListParams) {
  return useQuery({
    queryKey: ['lms-courses', params],
    queryFn: () => lmsApi.getCourses({ limit: 100, ...params }),
    retry: 2,
    staleTime: 60_000,
  });
}

export function useLmsGroups(params?: LmsGroupListParams) {
  return useQuery({
    queryKey: ['lms-groups', params],
    queryFn: () => lmsApi.getGroups(params),
    retry: 2,
    staleTime: 60_000,
    enabled: !!params?.courseId,
  });
}

export function useLmsStudentSummary(studentId: string | undefined) {
  return useQuery({
    queryKey: ['lms-student-summary', studentId],
    queryFn: () => lmsApi.getStudentSummary(studentId!),
    retry: 2,
    staleTime: 30_000,
    enabled: !!studentId,
  });
}

// ==================== MUTATIONS (no retry) ====================

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: { data: CreateEnrollmentRequest; idempotencyKey: string }) =>
      lmsApi.createEnrollment(data, { idempotencyKey }),
    retry: false,
    onSuccess: async () => {
      toast({ title: 'Каттоо ийгиликтүү түзүлдү' });
      await invalidateLmsQueries(queryClient);
    },
    onError: (err: unknown) => {
      const error = formatLmsError(err, 'Каттоо түзүүдө ката кетти');
      toast({ title: error.title, variant: 'destructive' });
    },
  });
}

export function useActivateEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ enrollmentId, data, idempotencyKey }: { enrollmentId: string; data: ActivateEnrollmentRequest; idempotencyKey: string }) =>
      lmsApi.activateEnrollment(enrollmentId, data, { idempotencyKey }),
    retry: false,
    onSuccess: async () => {
      toast({ title: 'Каттоо активдештирилди' });
      await invalidateLmsQueries(queryClient);
    },
    onError: (err: unknown) => {
      const error = formatLmsError(err, 'Активдештирүүдө ката кетти');
      toast({ title: error.title, variant: 'destructive' });
    },
  });
}

export function usePauseEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ enrollmentId, data, idempotencyKey }: { enrollmentId: string; data: PauseEnrollmentRequest; idempotencyKey: string }) =>
      lmsApi.pauseEnrollment(enrollmentId, data, { idempotencyKey }),
    retry: false,
    onSuccess: async () => {
      toast({ title: 'Каттоо тындырылды' });
      await invalidateLmsQueries(queryClient);
    },
    onError: (err: unknown) => {
      const error = formatLmsError(err, 'Тындырууда ката кетти');
      toast({ title: error.title, variant: 'destructive' });
    },
  });
}
