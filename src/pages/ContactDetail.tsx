import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ky } from '@/lib/i18n';
import { ArrowLeft, Phone, Mail, User, Link2, Loader2, BookOpen, Activity, Workflow } from 'lucide-react';
import { contactApi } from '@/api/modules';
import type { Contact } from '@/types';
import { useLmsIntegrationHistory, useLmsStudentSummary } from '@/hooks/use-lms';

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    contactApi.get(Number(id))
      .then(setContact)
      .catch(() => setError('Байланыш табылган жок'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const {
    data: studentSummary,
    isLoading: lmsLoading,
    isError: lmsError,
  } = useLmsStudentSummary(contact?.lmsStudentId || undefined);
  const {
    data: historyData,
    isLoading: historyLoading,
  } = useLmsIntegrationHistory({
    crmContactId: contact?.id,
    lmsStudentId: contact?.lmsStudentId,
    limit: 5,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{error || 'Байланыш табылган жок'}</p>
        <Button variant="outline" onClick={() => navigate('/contacts')}><ArrowLeft className="mr-2 h-4 w-4" />{ky.common.back}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={contact.fullName}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/contacts')}>
              <ArrowLeft className="mr-2 h-4 w-4" />{ky.common.back}
            </Button>
            <Button variant="outline">{ky.common.edit}</Button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card border-border/50 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Байланыш маалыматы</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={User} label={ky.common.name} value={contact.fullName} />
              <InfoRow icon={Phone} label={ky.common.phone} value={contact.phone} />
              <InfoRow icon={Mail} label={ky.common.email} value={contact.email} />
              <InfoRow icon={Link2} label="LMS ID" value={contact.lmsStudentId || '—'} />
              <InfoRow icon={Link2} label="Тышкы ID" value={contact.externalStudentId || '—'} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-card border-border/50">
            <CardHeader><CardTitle className="text-base">{ky.common.notes}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{contact.notes || 'Эскертүүлөр жок'}</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                LMS маалыматы
              </CardTitle>
              {contact.lmsStudentId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/enrollments?studentId=${encodeURIComponent(contact.lmsStudentId || '')}`)}
                >
                  LMS каттоо
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!contact.lmsStudentId ? (
                <p className="text-sm text-muted-foreground">LMS студент байланышы жок.</p>
              ) : lmsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  LMS маалыматы жүктөлүүдө...
                </div>
              ) : lmsError || !studentSummary ? (
                <p className="text-sm text-muted-foreground">LMS маалыматын алуу мүмкүн болбоду.</p>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{studentSummary.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      LMS ID: {studentSummary.studentId}
                    </p>
                    {studentSummary.phone && (
                      <p className="text-xs text-muted-foreground">{studentSummary.phone}</p>
                    )}
                    {studentSummary.email && (
                      <p className="text-xs text-muted-foreground">{studentSummary.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Каттоолор</p>
                    {studentSummary.enrollments?.length ? (
                      studentSummary.enrollments.map((enrollment) => (
                        <div key={enrollment.enrollmentId} className="rounded-md border p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{enrollment.courseName || enrollment.courseId}</p>
                              <p className="text-xs text-muted-foreground">
                                {enrollment.groupName || enrollment.groupId || 'Топсуз каттоо'}
                              </p>
                            </div>
                            <EnrollmentStatusBadge status={enrollment.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Каттоо ID: {enrollment.enrollmentId}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Каттоолор табылган жок.</p>
                    )}
                  </div>

                  {studentSummary.academic && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Академиялык көрүнүш
                      </p>
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <Metric label="Катышуу" value={studentSummary.academic.attendanceRate} />
                        <Metric label="Үй тапшырма" value={studentSummary.academic.homeworkCompletionRate} />
                        <Metric label="Тест катышуу" value={studentSummary.academic.quizParticipationRate} />
                        <Metric label="Жалпы прогресс" value={studentSummary.academic.progressPercent} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                LMS окуялары
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/enrollments?crmContactId=${contact.id}${contact.lmsStudentId ? `&studentId=${encodeURIComponent(contact.lmsStudentId)}` : ''}`)}
              >
                Толук тарых
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {historyLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  LMS окуялары жүктөлүүдө...
                </div>
              ) : !historyData?.items?.length ? (
                <p className="text-sm text-muted-foreground">LMS окуялары табылган жок.</p>
              ) : (
                historyData.items.map((item) => (
                  <div key={item.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {item.source === 'outbound' ? 'CRM → LMS' : 'LMS → CRM'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.endpoint || '—'} • {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                      <HistoryStatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.message || 'Интеграция окуясы'}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {item.enrollmentStatus ? <span>Статус: {item.enrollmentStatus}</span> : null}
                      {item.requestId ? <span>Request ID: {item.requestId}</span> : null}
                      {item.eventId ? <span>Event ID: {item.eventId}</span> : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-muted p-2"><Icon className="h-4 w-4 text-muted-foreground" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function EnrollmentStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'active' || status === 'completed'
      ? 'default'
      : status === 'cancelled'
        ? 'destructive'
        : 'secondary';

  const label =
    status === 'pending'
      ? 'Күтүүдө'
      : status === 'active'
        ? 'Активдүү'
        : status === 'completed'
          ? 'Аяктаган'
          : status === 'cancelled'
            ? 'Жокко чыгарылган'
            : status;

  return <Badge variant={variant}>{label}</Badge>;
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? 0}%</p>
    </div>
  );
}

function HistoryStatusBadge({ status }: { status?: string | null }) {
  const variant =
    status === 'success' || status === 'received' || status === 'active'
      ? 'default'
      : status === 'error' || status === 'failed' || status === 'cancelled'
        ? 'destructive'
        : 'secondary';

  return <Badge variant={variant}>{status || '—'}</Badge>;
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ky-KG', { dateStyle: 'short', timeStyle: 'short' });
}
