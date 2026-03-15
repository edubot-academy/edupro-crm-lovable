import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lmsApi } from '@/api/modules';
import type {
  LmsCourseListParams, LmsGroupListParams,
  CreateEnrollmentRequest, ActivateEnrollmentRequest, PauseEnrollmentRequest,
} from '@/types/lms';
import { useToast } from '@/hooks/use-toast';

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
    mutationFn: (data: CreateEnrollmentRequest) => lmsApi.createEnrollment(data),
    retry: false,
    onSuccess: () => {
      toast({ title: 'Каттоо ийгиликтүү түзүлдү' });
      queryClient.invalidateQueries({ queryKey: ['lms-'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : 'Каттоо түзүүдө ката кетти';
      toast({ title: message, variant: 'destructive' });
    },
  });
}

export function useActivateEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ enrollmentId, data }: { enrollmentId: string; data: ActivateEnrollmentRequest }) =>
      lmsApi.activateEnrollment(enrollmentId, data),
    retry: false,
    onSuccess: () => {
      toast({ title: 'Каттоо активдештирилди' });
      queryClient.invalidateQueries({ queryKey: ['lms-'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : 'Активдештирүүдө ката кетти';
      toast({ title: message, variant: 'destructive' });
    },
  });
}

export function usePauseEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ enrollmentId, data }: { enrollmentId: string; data: PauseEnrollmentRequest }) =>
      lmsApi.pauseEnrollment(enrollmentId, data),
    retry: false,
    onSuccess: () => {
      toast({ title: 'Каттоо тындырылды' });
      queryClient.invalidateQueries({ queryKey: ['lms-'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : 'Тындырууда ката кетти';
      toast({ title: message, variant: 'destructive' });
    },
  });
}
