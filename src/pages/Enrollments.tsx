import { PageHeader } from '@/components/PageShell';
import { EnrollmentForm } from '@/components/lms/EnrollmentForm';
import { IntegrationHistoryPanel } from '@/components/lms/IntegrationHistoryPanel';
import { StudentSummaryPanel } from '@/components/lms/StudentSummaryPanel';

export default function EnrollmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="LMS Каттоо" description="Курсларга студенттерди каттоо жана башкаруу" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnrollmentForm />
        <StudentSummaryPanel />
      </div>
      <IntegrationHistoryPanel />
    </div>
  );
}
