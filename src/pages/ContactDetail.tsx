import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ky } from '@/lib/i18n';
import { contactApi, bridgeApi } from '@/api/modules';
import type { Contact } from '@/types';
import type { ContactWithStudentMapping } from '@/types/bridge';
import { User, Phone, Mail, Link2, BookOpen, Workflow, GraduationCap, Pencil, Trash2, Copy, Loader2, ArrowLeft, Calendar, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useLmsBridge } from '@/components/lms/LmsBridgeProvider';
import { ContactStudentMapping } from '@/components/lms/ContactStudentMapping';
import { useCreateStudentOnboardingLink, useLmsIntegrationHistory, useLmsStudentSummary } from '@/hooks/use-lms';
import { ScheduleTimelineEventDialog } from '@/components/ScheduleTimelineEventDialog';
import { ScheduledTimelineEventsCard } from '@/components/ScheduledTimelineEventsCard';
import { getFriendlyError } from '@/lib/error-messages';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewLmsTechnicalFields, canViewStudentSummary, canViewIntegrationHistory } = useRolePermissions();
  const { isLmsBridgeEnabled } = useLmsBridge();
  const [contact, setContact] = useState<Contact | null>(null);
  const [bridgeData, setBridgeData] = useState<ContactWithStudentMapping | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [onboardingLink, setOnboardingLink] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    contactApi.get(Number(id))
      .then((data) => {
        setContact(data);
        setOnboardingLink(null);
      })
      .catch(() => setError('Байланыш табылган жок'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!contact || !isLmsBridgeEnabled) {
      setBridgeData(null);
      return;
    }
    bridgeApi.getContactBridgeData(contact.id)
      .then((data) => setBridgeData(data))
      .catch(() => setBridgeData(null));
  }, [contact, isLmsBridgeEnabled]);

  const {
    data: studentSummary,
    isLoading: lmsLoading,
    isError: lmsError,
  } = useLmsStudentSummary(
    isLmsBridgeEnabled && canViewStudentSummary() ? (bridgeData?.lmsStudentId || undefined) : undefined
  );
  const {
    data: historyData,
    isLoading: historyLoading,
  } = useLmsIntegrationHistory(
    isLmsBridgeEnabled && canViewLmsTechnicalFields() ? {
      crmContactId: contact?.id,
      lmsStudentId: bridgeData?.lmsStudentId,
      limit: 5,
    } : undefined,
  );
  const createOnboardingLinkMutation = useCreateStudentOnboardingLink();

  useEffect(() => {
    if (!contact) return;
    setForm({
      fullName: contact.fullName,
      phone: contact.phone,
      email: contact.email || '',
      notes: contact.notes || '',
    });
  }, [contact]);

  const resetEditForm = () => {
    if (!contact) {
      setIsEditOpen(false);
      return;
    }

    setForm({
      fullName: contact.fullName,
      phone: contact.phone,
      email: contact.email || '',
      notes: contact.notes || '',
    });
    setIsEditOpen(false);
  };

  const handleSave = async () => {
    if (!contact || !form.fullName || !form.phone) return;

    setIsSaving(true);
    try {
      const updatedContact = await contactApi.update(contact.id, {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
        notes: form.notes || undefined,
      });
      setContact(updatedContact);
      setIsEditOpen(false);
      toast({ title: 'Байланыш ийгиликтүү өзгөртүлдү' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Байланышты сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateOnboardingLink = () => {
    if (!bridgeData?.lmsStudentId) return;

    createOnboardingLinkMutation.mutate(
      { studentId: bridgeData.lmsStudentId },
      {
        onSuccess: async (response) => {
          const setupLink = response.onboarding?.setupLink || null;
          setOnboardingLink(setupLink);

          if (!setupLink) {
            toast({ title: 'Жаңы LMS кирүү шилтемеси түзүлгөн жок', variant: 'destructive' });
            return;
          }

          try {
            await navigator.clipboard.writeText(setupLink);
            toast({ title: 'LMS кирүү шилтемеси көчүрүлдү' });
          } catch {
            toast({ title: 'LMS кирүү шилтемеси даяр болду' });
          }
        },
      },
    );
  };

  const handleCopyOnboardingLink = async () => {
    if (!onboardingLink) return;

    try {
      await navigator.clipboard.writeText(onboardingLink);
      toast({ title: 'LMS кирүү шилтемеси көчүрүлдү' });
    } catch {
      toast({ title: 'Шилтемени көчүрүү мүмкүн болгон жок', variant: 'destructive' });
    }
  };

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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/contacts')}>
              <ArrowLeft className="mr-2 h-4 w-4" />{ky.common.back}
            </Button>
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>{ky.common.edit}</Button>
            <Button variant="outline" onClick={() => setIsScheduleOpen(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Пландоо
            </Button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card border-border/50 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">{ky.contacts.infoTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={User} label={ky.common.name} value={contact.fullName} />
              <InfoRow icon={Phone} label={ky.common.phone} value={contact.phone} />
              <InfoRow icon={Mail} label={ky.common.email} value={contact.email} />
            </div>
          </CardContent>
        </Card>

        {isLmsBridgeEnabled && canViewLmsTechnicalFields() && bridgeData && (
          <ContactStudentMapping
            lmsStudentId={bridgeData.lmsStudentId}
            externalStudentId={bridgeData.externalStudentId}
            contactId={contact.id}
          />
        )}

        <div className="space-y-4">
          <Card className="shadow-card border-border/50">
            <CardHeader><CardTitle className="text-base">{ky.common.notes}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{contact.notes || 'Эскертүүлөр жок'}</p>
            </CardContent>
          </Card>

          {isLmsBridgeEnabled && canViewStudentSummary() && bridgeData?.lmsStudentId && (
            <Card className="shadow-card border-border/50">
              <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                <CardTitle className="text-base flex items-center gap-2 leading-tight">
                  <BookOpen className="h-4 w-4" />
                  {ky.contacts.lmsInfoTitle}
                </CardTitle>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateOnboardingLink}
                    disabled={createOnboardingLinkMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {createOnboardingLinkMutation.isPending ? 'Түзүлүүдө...' : ky.contacts.newLmsLink}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {onboardingLink && (
                  <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Жаңы LMS кирүү шилтемеси</p>
                        <p className="mt-1 break-all text-xs text-muted-foreground">{onboardingLink}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyOnboardingLink}
                        className="w-full sm:w-auto"
                      >
                        Шилтемени көчүрүү
                      </Button>
                    </div>
                  </div>
                )}

                {lmsLoading ? (
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
          )}

          {isLmsBridgeEnabled && canViewIntegrationHistory() && bridgeData?.lmsStudentId && (
            <Card className="shadow-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  LMS окуялары
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/enrollments?crmContactId=${contact.id}${bridgeData?.lmsStudentId ? `&studentId=${encodeURIComponent(bridgeData.lmsStudentId)}` : ''}`)}
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
                ) : !historyData?.data?.length ? (
                  <p className="text-sm text-muted-foreground">LMS окуялары табылган жок.</p>
                ) : (
                  historyData.data.map((item) => (
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
          )}

          <ScheduledTimelineEventsCard
            contactId={contact.id}
            refreshKey={scheduleRefreshKey}
          />
        </div>
      </div>
      {isScheduleOpen && (
        <ScheduleTimelineEventDialog
          open={isScheduleOpen}
          onOpenChange={setIsScheduleOpen}
          defaultType="call"
          contactId={contact.id}
          onSaved={() => setScheduleRefreshKey((prev) => prev + 1)}
        />
      )}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        if (!open) {
          resetEditForm();
          return;
        }
        setIsEditOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ky.contacts.editTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{ky.common.name} *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder={ky.common.fullNamePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.phone} *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+996 ..."
              />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.email}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder={ky.common.emailPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.notes}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder={ky.common.notesPlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetEditForm} disabled={isSaving}>
              {ky.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.fullName || !form.phone}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
