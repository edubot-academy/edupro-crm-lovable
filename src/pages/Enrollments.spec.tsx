import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EnrollmentsPage from './Enrollments';

const approveMutateAsync = vi.fn();
const toast = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'admin@example.com', fullName: 'Admin', role: 'admin' },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));

vi.mock('@/hooks/use-lms', () => ({
  useLmsCourses: () => ({
    data: { items: [{ id: 'course-1', name: 'English' }] },
  }),
  useLmsGroups: () => ({
    data: { items: [] },
  }),
}));

vi.mock('@/hooks/use-enrollments', () => ({
  usePendingEnrollments: () => ({
    data: {
      pending: [{
        enrollmentId: '101',
        crmLeadId: '7',
        courseId: 'course-1',
        courseType: 'video',
        student: {
          fullName: 'Aigerim',
          email: 'aigerim@example.com',
          phone: '+996700000001',
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        requestId: 'crm-enrollment:101',
      }],
    },
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
  useEnrollmentHistory: () => ({
    data: { enrollments: [], total: 0 },
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
  useApproveEnrollment: () => ({
    mutateAsync: approveMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/components/lms/EnrollmentForm', () => ({
  EnrollmentForm: () => <div>Enrollment Form Stub</div>,
}));

vi.mock('@/components/lms/StudentSummaryPanel', () => ({
  StudentSummaryPanel: () => <div>Student Summary Stub</div>,
}));

vi.mock('@/components/lms/IntegrationHistoryPanel', () => ({
  IntegrationHistoryPanel: () => <div>Integration History Stub</div>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children, value, onClick }: { children: React.ReactNode; value?: string; onClick?: () => void }) => <button data-value={value} onClick={onClick}>{children}</button>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('EnrollmentsPage', () => {
  beforeEach(() => {
    approveMutateAsync.mockReset();
    approveMutateAsync.mockResolvedValue(undefined);
    toast.mockReset();
  });

  it('approves a pending enrollment from the admin table', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <EnrollmentsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Бекитүү$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Бекитүү жана активдештирүү/i }));

    await waitFor(() => {
      expect(approveMutateAsync).toHaveBeenCalledWith({
        id: 101,
        notes: undefined,
      });
    });
  });
});
