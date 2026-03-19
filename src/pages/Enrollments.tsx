import { PageHeader } from '@/components/PageShell';
import { EnrollmentForm } from '@/components/lms/EnrollmentForm';
import { IntegrationHistoryPanel } from '@/components/lms/IntegrationHistoryPanel';
import { StudentSummaryPanel } from '@/components/lms/StudentSummaryPanel';
import { useSearchParams } from 'react-router-dom';

export default function EnrollmentsPage() {
  const [searchParams] = useSearchParams();
  const initialStudentId = searchParams.get('studentId') || undefined;
  const initialHistoryFilters = {
    crmContactId: searchParams.get('crmContactId') || undefined,
    lmsStudentId: searchParams.get('studentId') || undefined,
    lmsEnrollmentId: searchParams.get('enrollmentId') || undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="LMS Каттоо" description="Курсларга студенттерди каттоо жана башкаруу" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnrollmentForm />
        <StudentSummaryPanel initialStudentId={initialStudentId} />
      </div>
      <IntegrationHistoryPanel initialFilters={initialHistoryFilters} />
    </div>
  );
}
