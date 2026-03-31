import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send } from 'lucide-react';
import { useLmsCourses, useLmsGroups, useLmsStudentSummary } from '@/hooks/use-lms';
import { useCreateManagedEnrollment } from '@/hooks/use-enrollments';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { contactApi, dealsApi, leadsApi, lmsApi } from '@/api/modules';
import type { Contact, Deal, Lead } from '@/types';
import type { LmsCourseType, LmsEnrollmentResponse } from '@/types/lms';
import { getFriendlyError } from '@/lib/error-messages';
import { formatLmsDate, getCourseSalesSummary, getLmsGroupAvailability, getSeatsLeft } from '@/lib/lms-availability';

const courseTypeLabels: Record<LmsCourseType, string> = {
  video: 'Видео',
  offline: 'Оффлайн',
  online_live: 'Онлайн түз эфир',
};

const courseTypeBadgeClass: Record<LmsCourseType, string> = {
  video: 'bg-accent text-accent-foreground',
  offline: 'bg-primary/10 text-primary',
  online_live: 'bg-destructive/10 text-destructive',
};

export function EnrollmentForm() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dealId, setDealId] = useState('');
  const [notes, setNotes] = useState('');
  const [groupError, setGroupError] = useState('');
  const [linkedContact, setLinkedContact] = useState<Contact | null>(null);
  const idempotencyRef = useRef<{ signature: string; key: string } | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [onboardingInfo, setOnboardingInfo] = useState<LmsEnrollmentResponse['onboarding'] | null>(null);
  const { toast } = useToast();

  const { data: coursesData, isLoading: coursesLoading } = useLmsCourses({ isActive: 'true' });
  const courses = coursesData?.items ?? [];

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId]
  );
  const isVideo = selectedCourse?.courseType === 'video';
  const needsGroup = selectedCourse && !isVideo;

  const { data: groupsData, isLoading: groupsLoading } = useLmsGroups(
    needsGroup ? { courseId } : undefined
  );
  const groups = groupsData?.items ?? [];
  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === groupId),
    [groups, groupId]
  );
  const selectedLead = useMemo(
    () => leads.find((lead) => String(lead.id) === leadId),
    [leads, leadId]
  );
  const selectedDeal = useMemo(
    () => deals.find((deal) => String(deal.id) === dealId),
    [deals, dealId]
  );
  const resolvedContactId = selectedDeal?.contactId || selectedLead?.contactId || null;
  const prefillCourseId = searchParams.get('courseId') || '';
  const prefillGroupId = searchParams.get('groupId') || '';
  const prefillLeadId = searchParams.get('crmLeadId') || '';
  const prefillDealId = searchParams.get('crmDealId') || '';

  const lmsStudentId = linkedContact?.lmsStudentId || selectedDeal?.contact?.lmsStudentId || undefined;
  const { data: existingStudentSummary } = useLmsStudentSummary(lmsStudentId);
  const createManagedEnrollment = useCreateManagedEnrollment();

  const fillStudentFields = (next: { fullName?: string | null; phone?: string | null; email?: string | null }) => {
    setStudentName(next.fullName?.trim() || '');
    setStudentPhone(next.phone?.trim() || '');
    setStudentEmail(next.email?.trim() || '');
  };

  useEffect(() => {
    setLeadsLoading(true);
    leadsApi.list({ page: 1, limit: 100 })
      .then((res) => setLeads(res.items))
      .catch(() => setLeads([]))
      .finally(() => setLeadsLoading(false));

    setDealsLoading(true);
    dealsApi.list({ page: 1, limit: 100 })
      .then((res) => setDeals(res.items))
      .catch(() => setDeals([]))
      .finally(() => setDealsLoading(false));
  }, []);

  useEffect(() => {
    if (!resolvedContactId) {
      setLinkedContact(null);
      return;
    }

    let cancelled = false;

    contactApi.get(Number(resolvedContactId))
      .then((contact) => {
        if (cancelled) return;
        setLinkedContact(contact);
      })
      .catch(() => {
        if (cancelled) return;
        setLinkedContact(null);
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedContactId]);

  useEffect(() => {
    if (!courses.length || !prefillCourseId) return;
    const course = courses.find((item) => item.id === prefillCourseId);
    if (!course) return;
    setCourseId((current) => (current === course.id ? current : course.id));
  }, [courses, prefillCourseId]);

  useEffect(() => {
    if (!groups.length || !prefillGroupId) return;
    const group = groups.find((item) => item.id === prefillGroupId);
    if (!group) return;
    setGroupId((current) => (current === group.id ? current : group.id));
  }, [groups, prefillGroupId]);

  useEffect(() => {
    if (!prefillLeadId || !leads.length) return;
    const lead = leads.find((item) => String(item.id) === prefillLeadId);
    if (!lead) return;
    setLeadId((current) => (current === String(lead.id) ? current : String(lead.id)));
    fillStudentFields({
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
    });
  }, [leads, prefillLeadId]);

  useEffect(() => {
    if (!prefillDealId || !deals.length) return;
    const deal = deals.find((item) => String(item.id) === prefillDealId);
    if (!deal) return;
    setDealId((current) => (current === String(deal.id) ? current : String(deal.id)));
    if (deal.lmsCourseId) {
      setCourseId((current) => current || deal.lmsCourseId || '');
    }
    if (deal.lmsGroupId) {
      setGroupId((current) => current || deal.lmsGroupId || '');
    }
    if (deal.leadId) {
      setLeadId((current) => current || String(deal.leadId));
    }

    const linkedLead = deal.leadId
      ? leads.find((item) => item.id === deal.leadId)
      : undefined;

    fillStudentFields({
      fullName: deal.contact?.fullName || linkedLead?.fullName || '',
      phone: linkedLead?.phone || '',
      email: deal.contact?.email || linkedLead?.email || '',
    });
  }, [deals, leads, prefillDealId]);

  const handleCourseChange = (value: string) => {
    setCourseId(value);
    setGroupId('');
    setGroupError('');
    setSubmitError('');
  };

  const handleLeadChange = (value: string) => {
    if (value === '__none__') {
      setLeadId('');
      setStudentName('');
      setStudentPhone('');
      setStudentEmail('');
      setSubmitError('');
      return;
    }

    const lead = leads.find((item) => String(item.id) === value);
    setLeadId(value);
    setSubmitError('');
    if (!lead) return;
    fillStudentFields({
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email || selectedDeal?.contact?.email || '',
    });
  };

  const handleDealChange = (value: string) => {
    if (value === '__none__') {
      setDealId('');
      return;
    }
    const deal = deals.find((item) => String(item.id) === value);
    setDealId(value);
    if (!deal) return;
    if (deal.lmsCourseId) {
      setCourseId(deal.lmsCourseId);
    }
    if (deal.lmsGroupId) {
      setGroupId(deal.lmsGroupId);
    } else {
      setGroupId('');
    }
    const linkedLead = deal.leadId
      ? leads.find((item) => item.id === deal.leadId)
      : undefined;
    if (deal.leadId) {
      setLeadId(String(deal.leadId));
    }
    fillStudentFields({
      fullName: deal.contact?.fullName || linkedLead?.fullName || '',
      phone: linkedLead?.phone || studentPhone,
      email: deal.contact?.email || linkedLead?.email || '',
    });
  };

  const createMutationPending = createManagedEnrollment.isPending;

  const canSubmit =
    courseId &&
    (isVideo || groupId) &&
    studentName &&
    studentPhone &&
    studentEmail.trim() &&
    leadId &&
    !createMutationPending;

  const matchingExistingEnrollment = useMemo(() => {
    if (!courseId || !existingStudentSummary?.enrollments?.length) return null;

    return (
      existingStudentSummary.enrollments.find((enrollment) => {
        if (enrollment.courseId !== courseId) return false;
        if (!['pending', 'active'].includes(enrollment.status)) return false;
        if (isVideo) {
          return !enrollment.groupId;
        }
        return (enrollment.groupId || '') === groupId;
      }) || null
    );
  }, [courseId, existingStudentSummary?.enrollments, groupId, isVideo]);

  const lmsEmailLooksPlaceholder = (existingStudentSummary?.email || '').trim().toLowerCase().endsWith('@placeholder.local');
  const crmEmailLooksReal = !!studentEmail.trim() && !studentEmail.trim().toLowerCase().endsWith('@placeholder.local');
  const canRecreatePlaceholderAccount =
    (user?.role === 'admin' || user?.role === 'superadmin') &&
    !!matchingExistingEnrollment &&
    lmsEmailLooksPlaceholder &&
    crmEmailLooksReal;

  const submitManagedEnrollment = async (options?: { recreateExistingAccount?: boolean }) => {
    const response = await createManagedEnrollment.mutateAsync({
      leadId: Number(leadId),
      courseId,
      courseType: selectedCourse?.courseType || 'video',
      groupId: isVideo ? undefined : groupId,
      recreateExistingAccount: options?.recreateExistingAccount,
    });

    let onboarding: LmsEnrollmentResponse['onboarding'] | null = null;
    if (!response.requiresApproval && response.studentId) {
      try {
        const onboardingResponse = await lmsApi.createStudentOnboardingLink(response.studentId);
        onboarding = onboardingResponse.onboarding;
      } catch {
        onboarding = null;
      }
    }

    setOnboardingInfo(onboarding);
    setCourseId('');
    setGroupId('');
    setStudentName('');
    setStudentPhone('');
    setStudentEmail('');
    setLeadId('');
    setDealId('');
    setNotes('');
    setGroupError('');
    idempotencyRef.current = null;
    setSubmitError('');
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('courseId');
      next.delete('courseType');
      next.delete('groupId');
      return next;
    }, { replace: true });

    toast({
      title: response.requiresApproval ? 'Каттоо суроо-талабы түзүлдү' : 'Каттоо ийгиликтүү түзүлдү',
      description: response.message,
    });

    if (onboarding?.required && onboarding.setupLink) {
      toast({
        title: onboarding.emailSent
          ? 'LMS аккаунт шилтемеси даяр болуп, студентке жөнөтүлдү'
          : 'LMS аккаунт шилтемеси даяр болду',
        description: onboarding.emailSent
          ? 'Кааласаңыз, төмөндөн көчүрүп, студентке өзүңүз да жөнөтө аласыз.'
          : 'Төмөндөн көчүрүп, студентке жөнөтүңүз.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!courseId) {
      setSubmitError('Курсту тандаңыз');
      return;
    }

    if (!studentName.trim()) {
      setSubmitError('Студенттин атын жазыңыз');
      return;
    }

    if (!studentPhone.trim()) {
      setSubmitError('Телефон номерин жазыңыз');
      return;
    }

    if (!studentEmail.trim()) {
      setSubmitError('LMS каттоо үчүн студенттин email дарегин жазыңыз');
      return;
    }

    if (!leadId) {
      setSubmitError('CRM лидди тандаңыз');
      return;
    }

    if (!selectedLead?.contactId && !selectedDeal?.contactId) {
      setSubmitError('Адегенде лидди контактка айландырыңыз же контакт байланышкан келишимди тандаңыз');
      return;
    }

    if (needsGroup && !groupId) {
      setGroupError('Топту тандаңыз (группа/когорта)');
      setSubmitError('');
      return;
    }

    setSubmitError('');
    setOnboardingInfo(null);

    const payload = {
      leadId: Number(leadId),
      courseId,
      courseType: selectedCourse?.courseType,
      groupId: isVideo ? undefined : groupId,
    };

    const signature = JSON.stringify(payload);
    if (idempotencyRef.current?.signature !== signature) {
      idempotencyRef.current = { signature, key: crypto.randomUUID() };
    }

    try {
      await submitManagedEnrollment();
    } catch (err) {
      const error = getFriendlyError(err, { fallbackTitle: 'Каттоо түзүүдө ката кетти' });
      setSubmitError(error.description || error.title);
    }
  };

  const handleRecreatePlaceholderAccount = async () => {
    if (!canRecreatePlaceholderAccount) return;

    setSubmitError('');
    setOnboardingInfo(null);

    try {
      await submitManagedEnrollment({ recreateExistingAccount: true });
    } catch (err) {
      const error = getFriendlyError(err, { fallbackTitle: 'LMS аккаунтун кайра түзүү ишке ашкан жок' });
      setSubmitError(error.description || error.title);
    }
  };

  const copyOnboardingLink = async () => {
    if (!onboardingInfo?.setupLink) return;

    try {
      await navigator.clipboard.writeText(onboardingInfo.setupLink);
      toast({ title: 'LMS кирүү шилтемеси көчүрүлдү' });
    } catch {
      toast({ title: 'Шилтемени көчүрүү мүмкүн болгон жок', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Жаңы каттоо (Enrollment)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course selector */}
          <div className="space-y-2">
            <Label>Курс</Label>
            <Select value={courseId} onValueChange={handleCourseChange} disabled={coursesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={coursesLoading ? 'Жүктөлүүдө...' : 'Курс тандаңыз'} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      {c.name}
                      {c.courseType && (
                        <Badge variant="outline" className={courseTypeBadgeClass[c.courseType]}>
                          {courseTypeLabels[c.courseType]}
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCourse?.courseType && (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
                <p>
                  Түрү: {courseTypeLabels[selectedCourse.courseType]}
                  {isVideo && ' — Топ тандоо талап кылынбайт'}
                </p>
                {getCourseSalesSummary(selectedCourse).length > 1 && (
                  <p>{getCourseSalesSummary(selectedCourse).slice(1).join(' • ')}</p>
                )}
              </div>
            )}
          </div>

          {/* Group selector — hidden for video courses */}
          {needsGroup && (
            <div className="space-y-2">
              <Label>Топ *</Label>
              <Select
                value={groupId}
                onValueChange={(v) => { setGroupId(v); setGroupError(''); }}
                disabled={!courseId || groupsLoading}
              >
                <SelectTrigger className={groupError ? 'border-destructive' : ''}>
                  <SelectValue placeholder={
                    groupsLoading ? 'Жүктөлүүдө...' :
                    groups.length === 0 ? 'Топтор жок' : 'Топ тандаңыз'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="flex flex-col">
                        <span>
                          {g.name} {g.teacherName ? `(${g.teacherName})` : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {g.startDate && `Башталышы: ${formatLmsDate(g.startDate)}`}
                          {g.schedule ? ` — ${g.schedule}` : ''}
                          {getSeatsLeft(g) != null
                            ? ` | ${getSeatsLeft(g)} орун бош`
                            : ''}
                          {g.status ? ` | ${getLmsGroupAvailability(g).label}` : ''}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {groupError && <p className="text-xs text-destructive">{groupError}</p>}
              {selectedGroup && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{selectedGroup.name}</span>
                    <Badge variant={getLmsGroupAvailability(selectedGroup).tone}>
                      {getLmsGroupAvailability(selectedGroup).label}
                    </Badge>
                  </div>
                  <p>
                    {selectedGroup.startDate ? `Башталышы: ${formatLmsDate(selectedGroup.startDate)}` : 'Башталышы: такталган эмес'}
                    {selectedGroup.schedule ? ` • График: ${selectedGroup.schedule}` : ''}
                  </p>
                  <p>
                    {selectedGroup.teacherName ? `Мугалим: ${selectedGroup.teacherName}` : 'Мугалим: дайындала элек'}
                    {selectedGroup.capacity != null ? ` • Орун: ${selectedGroup.currentStudentCount ?? 0}/${selectedGroup.capacity}` : ''}
                    {getSeatsLeft(selectedGroup) != null ? ` • Бош орун: ${getSeatsLeft(selectedGroup)}` : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {isVideo && (
            <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              📹 Бул видео курс — өз темпиңизде өтөсүз. Топ тандоо талап кылынбайт.
            </div>
          )}

          <div className="space-y-2">
            <Label>CRM Лид *</Label>
            <Select value={leadId || '__none__'} onValueChange={handleLeadChange} disabled={leadsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={leadsLoading ? 'Жүктөлүүдө...' : 'Алгач CRM лидди тандаңыз'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Тандалган эмес</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={String(lead.id)}>
                    {lead.fullName} {lead.phone ? `• ${lead.phone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Лид тандалганда студенттин аты, телефону жана email талаалары автоматтык толот.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Келишим ID (милдеттүү эмес)</Label>
            <Select value={dealId || '__none__'} onValueChange={handleDealChange} disabled={dealsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={dealsLoading ? 'Жүктөлүүдө...' : 'Келишим тандаңыз'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Тандалган эмес</SelectItem>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={String(deal.id)}>
                    #{deal.id} {deal.contact?.fullName ? `• ${deal.contact.fullName}` : ''} {deal.courseNameSnapshot ? `• ${deal.courseNameSnapshot}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDeal && (
              <p className="text-xs text-muted-foreground">
                Курс: {selectedDeal.courseNameSnapshot || selectedDeal.lmsCourseId || '—'}
                {selectedDeal.groupNameSnapshot ? ` • Топ: ${selectedDeal.groupNameSnapshot}` : ''}
              </p>
            )}
          </div>

          {selectedLead && (
            <p className="text-xs text-muted-foreground">
              Тандалган лид: #{selectedLead.id}
              {selectedLead.contactId ? ` • Байланыш #${selectedLead.contactId}` : ''}
            </p>
          )}

          {/* Student info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Студент аты *</Label>
              <Input
                value={studentName}
                onChange={(e) => { setStudentName(e.target.value); setSubmitError(''); }}
                placeholder={leadId ? 'Студенттин аты' : 'Алгач CRM лидди тандаңыз'}
                disabled={!leadId}
              />
            </div>
            <div className="space-y-2">
              <Label>Телефон *</Label>
              <Input
                value={studentPhone}
                onChange={(e) => { setStudentPhone(e.target.value); setSubmitError(''); }}
                placeholder={leadId ? '+996 ...' : 'Алгач CRM лидди тандаңыз'}
                disabled={!leadId}
              />
            </div>
          <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={studentEmail}
                onChange={(e) => { setStudentEmail(e.target.value); setSubmitError(''); }}
                placeholder={leadId ? 'email@example.com' : 'Алгач CRM лидди тандаңыз'}
                disabled={!leadId}
              />
              <p className="text-xs text-muted-foreground">
                LMS аккаунтун даярдоо жана кирүү шилтемесин жөнөтүү үчүн чыныгы email милдеттүү.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Эскертүүлөр</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          {matchingExistingEnrollment && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-1 text-sm text-amber-900">
              <p className="font-medium">Бул студент бул курска мурунтан эле катталган.</p>
              <p>
                Учурдагы каттоо: {matchingExistingEnrollment.courseName || matchingExistingEnrollment.courseId}
                {matchingExistingEnrollment.groupName || matchingExistingEnrollment.groupId
                  ? ` • ${matchingExistingEnrollment.groupName || matchingExistingEnrollment.groupId}`
                  : ''}
                {` • ${matchingExistingEnrollment.status}`}
              </p>
              <p className="text-xs text-amber-800">
                Улантсаңыз, LMS учурдагы каттоону кайра колдонуп же жаңыртып коёт.
              </p>
              {canRecreatePlaceholderAccount && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-amber-800">
                    LMS студентинде placeholder email бар, ал эми CRMде чыныгы email көрсөтүлгөн. Admin катары жаңы LMS аккаунтун кайра түзө аласыз.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleRecreatePlaceholderAccount()}
                    disabled={createMutationPending}
                  >
                    {createMutationPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Placeholder аккаунтту кайра түзүү
                  </Button>
                </div>
              )}
            </div>
          )}

          {onboardingInfo?.required && onboardingInfo.setupLink && (
            <div className="rounded-md border bg-muted/40 p-3 space-y-2">
              <p className="text-sm font-medium">Студент үчүн LMS кирүү шилтемеси даяр</p>
              <p className="text-xs text-muted-foreground break-all">{onboardingInfo.setupLink}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {onboardingInfo.expiresAt && <span>Мөөнөтү: {formatLmsDate(onboardingInfo.expiresAt)}</span>}
                {onboardingInfo.emailSent && <span>Студентке email да жөнөтүлдү</span>}
              </div>
              <Button type="button" variant="outline" onClick={copyOnboardingLink}>
                Шилтемени көчүрүү
              </Button>
            </div>
          )}

          <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
            {createMutationPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Каттоо жиберүү
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
