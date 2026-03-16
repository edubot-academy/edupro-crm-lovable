import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User, BookOpen, Activity } from 'lucide-react';
import { useLmsStudentSummary } from '@/hooks/use-lms';
import { ActivateEnrollmentDialog, PauseEnrollmentDialog } from './EnrollmentActions';

function ProgressBar({ value, label, color }: { value?: number; label: string; color: string }) {
  const pct = value ?? 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

const statusVariant = (s: string) => {
  switch (s) {
    case 'active': return 'default' as const;
    case 'pending_activation': return 'secondary' as const;
    case 'paused': return 'outline' as const;
    case 'completed': return 'default' as const;
    case 'cancelled': return 'destructive' as const;
    default: return 'secondary' as const;
  }
};

const statusLabel: Record<string, string> = {
  pending_activation: 'Күтүүдө',
  active: 'Активдүү',
  paused: 'Тындырылган',
  completed: 'Аяктаган',
  cancelled: 'Жокко чыгарылган',
};

export function StudentSummaryPanel() {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [searchId, setSearchId] = useState<string | undefined>();

  const { data: summary, isLoading, isError, error } = useLmsStudentSummary(searchId);

  const handleSearch = () => {
    if (studentIdInput.trim()) setSearchId(studentIdInput.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Студент маалыматы
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="LMS Student ID"
            value={studentIdInput}
            onChange={(e) => setStudentIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="secondary" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
            {(error as { message?: string })?.message || 'Студент маалыматын жүктөөдө ката кетти'}
            {(error as { requestId?: string })?.requestId && (
              <div className="mt-1 text-xs text-destructive/80">
                Request ID: {(error as { requestId?: string }).requestId}
              </div>
            )}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && searchId && !summary && (
          <p className="text-sm text-muted-foreground">Маалымат табылган жок.</p>
        )}

        {/* Summary data */}
        {summary && (
          <div className="space-y-4">
            {/* Student info */}
            <div className="text-sm space-y-1">
              <p className="font-medium text-base">{summary.fullName}</p>
              {summary.phone && <p className="text-muted-foreground">{summary.phone}</p>}
              {summary.email && <p className="text-muted-foreground">{summary.email}</p>}
            </div>

            {/* Enrollments */}
            {summary.enrollments && summary.enrollments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> Каттоолор
                </h4>
                {summary.enrollments.map((e) => (
                  <div key={e.enrollmentId} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-medium">{e.courseName || e.courseId}</p>
                        <p className="text-xs text-muted-foreground">{e.groupName || e.groupId}</p>
                      </div>
                      <Badge variant={statusVariant(e.status)}>{statusLabel[e.status] || e.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {e.status === 'pending_activation' && (
                        <ActivateEnrollmentDialog enrollmentId={e.enrollmentId} />
                      )}
                      {e.status === 'active' && (
                        <PauseEnrollmentDialog enrollmentId={e.enrollmentId} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Academic */}
            {summary.academic && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <Activity className="h-4 w-4" /> Академиялык көрсөткүчтөр
                </h4>
                <div className="space-y-3">
                  <ProgressBar value={summary.academic.attendanceRate} label="Катышуу" color="bg-primary" />
                  <ProgressBar value={summary.academic.homeworkCompletionRate} label="Үй тапшырма" color="bg-chart-2" />
                  <ProgressBar value={summary.academic.quizParticipationRate} label="Тест катышуу" color="bg-chart-3" />
                  <ProgressBar value={summary.academic.progressPercent} label="Жалпы прогресс" color="bg-chart-4" />
                </div>
                {summary.academic.riskLevel && (
                  <p className="text-xs">
                    Тобокелдик деңгээли:{' '}
                    <span className={summary.academic.riskLevel === 'high' || summary.academic.riskLevel === 'critical' ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {summary.academic.riskLevel}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
