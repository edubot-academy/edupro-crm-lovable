import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enrollmentsApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';

function invalidateEnrollmentQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['enrollments', 'pending'] }),
    queryClient.invalidateQueries({ queryKey: ['enrollments', 'history'] }),
  ]);
}

export function usePendingEnrollments(enabled = true) {
  return useQuery({
    queryKey: ['enrollments', 'pending'],
    queryFn: () => enrollmentsApi.getPending(),
    enabled,
    staleTime: 15_000,
  });
}

export function useEnrollmentHistory(
  params: { status?: string; limit?: number; offset?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: ['enrollments', 'history', params],
    queryFn: () => enrollmentsApi.getHistory(params),
    enabled,
    staleTime: 15_000,
  });
}

export function useCreateManagedEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { leadId: number; courseId: string; courseType: 'video' | 'offline' | 'online_live'; groupId?: string; recreateExistingAccount?: boolean }) =>
      enrollmentsApi.create(data),
    onSuccess: async () => {
      await invalidateEnrollmentQueries(queryClient);
    },
    onError: (err: unknown) => {
      const error = getFriendlyError(err, { fallbackTitle: 'Каттоо түзүүдө ката кетти' });
      toast({ title: error.title, description: error.description, variant: 'destructive' });
    },
  });
}

export function useApproveEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      enrollmentsApi.approve(id, notes ? { notes } : {}),
    onSuccess: async () => {
      await invalidateEnrollmentQueries(queryClient);
    },
    onError: (err: unknown) => {
      const error = getFriendlyError(err, { fallbackTitle: 'Каттоону бекитүү мүмкүн болгон жок' });
      toast({ title: error.title, description: error.description, variant: 'destructive' });
    },
  });
}
