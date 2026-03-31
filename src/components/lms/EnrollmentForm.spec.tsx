import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EnrollmentForm } from './EnrollmentForm';

const {
  mutateAsync,
  toast,
  createStudentOnboardingLink,
  getMockLeads,
  getMockDeals,
  getMockContact,
  setMockLeads,
  setMockDeals,
  setMockContact,
} = vi.hoisted(() => {
  const state = {
    leads: [{
      id: 1,
      fullName: 'Aigerim',
      phone: '+996700000001',
      email: 'aigerim@example.com',
      contactId: null,
    }],
    deals: [] as Array<Record<string, unknown>>,
    contact: {
      id: 10,
      fullName: 'Aigerim',
      phone: '+996700000001',
      email: 'aigerim@example.com',
      lmsStudentId: 'student-1',
    },
  };

  return {
    mutateAsync: vi.fn(),
    toast: vi.fn(),
    createStudentOnboardingLink: vi.fn(),
    getMockLeads: () => state.leads,
    getMockDeals: () => state.deals,
    getMockContact: () => state.contact,
    setMockLeads: (value: typeof state.leads) => {
      state.leads = value;
    },
    setMockDeals: (value: typeof state.deals) => {
      state.deals = value;
    },
    setMockContact: (value: typeof state.contact) => {
      state.contact = value;
    },
  };
});

vi.mock('@/hooks/use-enrollments', () => ({
  useCreateManagedEnrollment: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-lms', () => ({
  useLmsCourses: () => ({
    data: {
      items: [{ id: 'course-1', name: 'English', courseType: 'video' }],
    },
    isLoading: false,
  }),
  useLmsGroups: () => ({
    data: { items: [] },
    isLoading: false,
  }),
  useLmsStudentSummary: () => ({
    data: undefined,
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'admin@example.com', fullName: 'Admin', role: 'admin' },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast,
  }),
}));

vi.mock('@/api/modules', () => ({
  leadsApi: {
    list: vi.fn().mockResolvedValue({
      get items() {
        return getMockLeads();
      },
    }),
  },
  dealsApi: {
    list: vi.fn().mockResolvedValue({
      get items() {
        return getMockDeals();
      },
    }),
  },
  contactApi: {
    get: vi.fn().mockImplementation(() => Promise.resolve(getMockContact())),
  },
  lmsApi: {
    createStudentOnboardingLink,
  },
}));

vi.mock('@/components/ui/select', () => {
  const Select = ({ value, onValueChange, children }: { value?: string; onValueChange?: (value: string) => void; children: React.ReactNode }) => (
    <select aria-label="mock-select" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  );
  const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const SelectValue = ({ placeholder }: { placeholder?: string }) => <option value="">{placeholder || 'select'}</option>;
  const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{typeof children === 'string' ? children : value}</option>
  );
  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

describe('EnrollmentForm', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    toast.mockReset();
    createStudentOnboardingLink.mockReset();
    createStudentOnboardingLink.mockResolvedValue({
      onboarding: {
        required: true,
        setupLink: 'https://lms.example.com/setup',
        emailSent: false,
      },
    });
    setMockLeads([{
      id: 1,
      fullName: 'Aigerim',
      phone: '+996700000001',
      email: 'aigerim@example.com',
      contactId: null,
    }]);
    setMockDeals([]);
    setMockContact({
      id: 10,
      fullName: 'Aigerim',
      phone: '+996700000001',
      email: 'aigerim@example.com',
      lmsStudentId: 'student-1',
    });
  });

  it('blocks manual enrollment when the selected lead has not been converted to a contact', async () => {
    render(
      <MemoryRouter
        initialEntries={['/enrollments?crmLeadId=1&courseId=course-1']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <EnrollmentForm />
      </MemoryRouter>,
    );

    await screen.findByDisplayValue('Aigerim');

    const submitButton = screen.getByRole('button', { name: /Каттоо жиберүү/i });
    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Адегенде лидди контактка айландырыңыз/i)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits an admin enrollment request and fetches onboarding when activation is immediate', async () => {
    setMockLeads([{
      id: 1,
      fullName: 'Aigerim',
      phone: '+996700000001',
      email: 'aigerim@example.com',
      contactId: 10,
    }]);
    mutateAsync.mockResolvedValue({
      success: true,
      enrollmentId: 'lms-enr-1',
      studentId: 'student-1',
      status: 'activated',
      message: 'Студент ийгиликтүү катталып, дароо активацияланды.',
      requiresApproval: false,
    });

    render(
      <MemoryRouter
        initialEntries={['/enrollments?crmLeadId=1&courseId=course-1']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <EnrollmentForm />
      </MemoryRouter>,
    );

    await screen.findByDisplayValue('Aigerim');

    const submitButton = screen.getByRole('button', { name: /Каттоо жиберүү/i });
    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        leadId: 1,
        courseId: 'course-1',
        courseType: 'video',
        groupId: undefined,
      });
    });

    await waitFor(() => {
      expect(createStudentOnboardingLink).toHaveBeenCalledWith('student-1');
    });

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Каттоо ийгиликтүү түзүлдү',
    }));
  });
});
