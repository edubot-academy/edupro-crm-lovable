import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { PageError, PageHeader, PageLoading } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { ky } from '@/lib/i18n';
import { ArrowLeft, Phone, Mail, Tag, User, MessageSquare, Loader2, Save, Calendar, Sparkles } from 'lucide-react';
import { leadsApi, usersApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useLmsBridge } from '@/components/lms/LmsBridgeProvider';
import { useFeatureFlags } from '@/components/core/FeatureFlagProvider';
import { useTenantConfig } from '@/components/core/TenantConfigProvider';
import type { AssignableUser, Lead, LeadSource } from '@/types';
import type { LmsCourseType } from '@/types/lms';
import { getFriendlyError } from '@/lib/error-messages';
import { ScheduleTimelineEventDialog } from '@/components/ScheduleTimelineEventDialog';
import { ScheduledTimelineEventsCard } from '@/components/ScheduledTimelineEventsCard';
import { LeadCourseInterest } from '@/components/lms/LeadCourseInterest';
import { LmsCourseContextFields } from '@/components/lms/LmsCourseContextFields';
import { useLmsCourses, useLmsGroups } from '@/hooks/use-lms';
import { leadInterestLevelLabels } from '@/lib/lms-formatting';
import { AiDraftModal } from '@/components/ai/AiDraftModal';
import { AiDraftHandoffCard } from '@/components/ai/AiDraftHandoffCard';

type LeadDetailFormState = {
  fullName: string;
  phone: string;
  email: string;
  source: LeadSource | '';
  status: string;
  assignedManagerId: string;
  notes: string;
  interestedCourseId: string;
  interestedGroupId: string;
  courseType: LmsCourseType | '';
  interestLevel: 'low' | 'medium' | 'high' | '';
};

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags();
  const { tenantConfig } = useTenantConfig();
  const { canAssignLeads } = useRolePermissions();
  const { isLmsBridgeEnabled } = useLmsBridge();
  const isAiDraftsEnabled =
    isFeatureEnabled('ai_assist_enabled') && isFeatureEnabled('ai_followup_drafts_enabled');
  const canAssignToSales = canAssignLeads();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAiDraftOpen, setIsAiDraftOpen] = useState(false);
  const [aiDraftMessage, setAiDraftMessage] = useState('');
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [managers, setManagers] = useState<AssignableUser[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);

  // Use tenant-configured lead sources if available, otherwise use hardcoded sources
  const leadSourceOptions = useMemo(() => {
    if (tenantConfig.leadSources && tenantConfig.leadSources.length > 0) {
      return tenantConfig.leadSources.map(source => ({
        value: source.sourceKey as LeadSource,
        label: source.sourceName,
      }));
    }
    // Fallback to hardcoded sources
    return Object.entries(ky.leadSource).map(([value, label]) => ({
      value: value as LeadSource,
      label,
    }));
  }, [tenantConfig.leadSources]);

  // Use tenant-configured lead statuses if available, otherwise use hardcoded statuses
  const leadStatusOptions = useMemo(() => {
    if (tenantConfig.leadStatuses && tenantConfig.leadStatuses.length > 0) {
      return tenantConfig.leadStatuses.map(status => ({
        value: status.key,
        label: status.label,
      }));
    }
    // Fallback to hardcoded statuses
    return [
      { value: 'new', label: 'New' },
      { value: 'contacted', label: 'Contacted' },
      { value: 'interested', label: 'Interested' },
      { value: 'no_response', label: 'No Response' },
      { value: 'lost', label: 'Lost' },
    ];
  }, [tenantConfig.leadStatuses]);

  const [form, setForm] = useState<LeadDetailFormState>({
    fullName: '',
    phone: '',
    email: '',
    source: '' as LeadSource | '',
    status: 'new',
    assignedManagerId: '',
    notes: '',
    interestedCourseId: '',
    interestedGroupId: '',
    courseType: '',
    interestLevel: '',
  });

  const { data: coursesData } = useLmsCourses(isLmsBridgeEnabled ? { isActive: 'true' } : undefined);
  const courses = coursesData?.items ?? [];
  const selectedLeadCourseId = form.interestedCourseId || lead?.interestedCourseId || '';
  const selectedLeadCourse = courses.find((course) => course.id === selectedLeadCourseId) ?? null;
  const { data: groupsData } = useLmsGroups(
    isLmsBridgeEnabled && selectedLeadCourseId && selectedLeadCourse?.courseType !== 'video'
      ? { courseId: selectedLeadCourseId, limit: 100 }
      : undefined,
  );
  const groups = groupsData?.items ?? [];
  const leadCourseName = courses.find((course) => course.id === lead?.interestedCourseId)?.name;
  const leadGroupName = groups.find((group) => group.id === lead?.interestedGroupId)?.name;

  useEffect(() => {
    if (!id || id === 'new') return;
    const numId = Number(id);
    if (isNaN(numId)) { setError('Лид табылган жок'); setIsLoading(false); return; }
    setIsLoading(true);
    leadsApi.get(numId)
      .then(setLead)
      .catch(() => setError('Лид табылган жок'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!lead) return;
    setForm({
      fullName: lead.fullName ?? '',
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      source: lead.source,
      status: lead.status,
      assignedManagerId: lead.assignedManager?.id ? String(lead.assignedManager.id) : '',
      notes: lead.notes || '',
      interestedCourseId: lead.interestedCourseId || '',
      interestedGroupId: lead.interestedGroupId || '',
      courseType: lead.courseType || '',
      interestLevel: lead.interestLevel || '',
    });
  }, [lead]);

  useEffect(() => {
    if (!isEditOpen) return;
    if (!canAssignToSales) {
      setManagers(user ? [{ id: user.id, fullName: user.fullName || user.email, email: user.email, role: user.role }] : []);
      setManagersLoading(false);
      return;
    }
    setManagersLoading(true);
    usersApi.assignables({ roles: 'sales' })
      .then((items) => {
        if (!user) {
          setManagers(items);
          return;
        }

        const hasCurrentUser = items.some((item) => item.id === user.id);
        const nextManagers = hasCurrentUser
          ? items
          : [{ id: user.id, fullName: user.fullName || user.email, email: user.email, role: user.role }, ...items];
        setManagers(nextManagers);
      })
      .catch(() => setManagers([]))
      .finally(() => setManagersLoading(false));
  }, [isEditOpen, canAssignToSales, user]);

  const resetEditForm = () => {
    if (!lead) {
      setIsEditOpen(false);
      return;
    }

    setForm({
      fullName: lead.fullName ?? '',
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      source: lead.source,
      status: lead.status,
      assignedManagerId: lead.assignedManager?.id ? String(lead.assignedManager.id) : '',
      notes: lead.notes || '',
      interestedCourseId: lead.interestedCourseId || '',
      interestedGroupId: lead.interestedGroupId || '',
      courseType: lead.courseType || '',
      interestLevel: lead.interestLevel || '',
    });
    setIsEditOpen(false);
  };

  const handleUseDraft = (message: string) => {
    setAiDraftMessage(message);
    toast({
      title: 'Сунуш кошулду',
      description: 'Сунушталган жооп төмөнкү талаага жайгаштырылды.',
    });
  };

  const handleSave = async () => {
    if (!lead || !form.fullName || !form.phone || !form.source) return;

    setIsSaving(true);
    try {
      const updatedLead = await leadsApi.update(lead.id, {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        source: form.source,
        status: form.status,
        assignedManagerId: canAssignToSales
          ? (form.assignedManagerId ? Number(form.assignedManagerId) : null)
          : undefined,
        notes: form.notes || undefined,
        interestedCourseId: isLmsBridgeEnabled ? form.interestedCourseId : undefined,
        interestedGroupId: isLmsBridgeEnabled ? form.interestedGroupId : undefined,
        courseType: isLmsBridgeEnabled ? (form.courseType || null) : undefined,
        interestLevel: isLmsBridgeEnabled ? (form.interestLevel || null) : undefined,
      });
      setLead(updatedLead);
      setIsEditOpen(false);
      toast({ title: 'Лид ийгиликтүү өзгөртүлдү' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Лидди сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToContact = async () => {
    if (!lead) return;

    setIsConverting(true);
    try {
      const result = await leadsApi.convertToContact(lead.id);
      setLead((prev) => (prev ? { ...prev, contactId: result.contact.id } : prev));
      toast({ title: 'Лид ийгиликтүү байланышка айландырылды' });
      navigate(`/contacts/${result.contact.id}`);
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Лидди байланышка айландыруу ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsConverting(false);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error || !lead) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Лид"
          actions={
            <Button variant="outline" onClick={() => navigate('/leads')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {ky.common.back}
            </Button>
          }
        />
        <PageError message={error || 'Лид табылган жок'} onRetry={() => navigate('/leads')} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={lead.fullName}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/leads')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {ky.common.back}
            </Button>
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              {ky.common.edit}
            </Button>
            {isAiDraftsEnabled ? (
              <Button variant="outline" onClick={() => setIsAiDraftOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                AI жооп сунушу
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams({
                  create: '1',
                  leadId: String(lead.id),
                });
                if (lead.contactId) params.set('contactId', String(lead.contactId));
                if (lead.interestedCourseId) params.set('courseId', lead.interestedCourseId);
                if (lead.interestedGroupId) params.set('groupId', lead.interestedGroupId);
                if (lead.courseType) params.set('courseType', lead.courseType);
                if (leadCourseName) params.set('courseName', leadCourseName);
                if (leadGroupName) params.set('groupName', leadGroupName);
                navigate(`/deals?${params.toString()}`);
              }}
              disabled={!lead.contactId}
            >
              Келишим түзүү
            </Button>
            <Button variant="outline" onClick={() => setIsScheduleOpen(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Пландоо
            </Button>
            <Button onClick={handleConvertToContact} disabled={isConverting || !!lead.contactId}>
              {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lead.contactId ? 'Байланышка айланган' : ky.leads.convertToContact}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {aiDraftMessage ? (
          <AiDraftHandoffCard
            value={aiDraftMessage}
            onChange={setAiDraftMessage}
            onClear={() => setAiDraftMessage('')}
            className="lg:col-span-3"
          />
        ) : null}

        <Card className="shadow-card border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Лид маалыматы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={User} label={ky.common.name} value={lead.fullName} />
              <InfoRow icon={Phone} label={ky.common.phone} value={lead.phone} />
              <InfoRow icon={Mail} label={ky.common.email} value={lead.email} />
              <InfoRow icon={MessageSquare} label={ky.leads.source} value={ky.leadSource[lead.source]} />
              <InfoRow icon={User} label={ky.leads.assignedManager} value={lead.assignedManager?.fullName || '—'} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{ky.common.status}</p>
              <StatusBadge variant={getLeadStatusVariant(lead.status)} dot>{leadStatusOptions.find(opt => opt.value === lead.status)?.label || lead.status}</StatusBadge>
            </div>
          </CardContent>
        </Card>

        {isLmsBridgeEnabled && (
          <LeadCourseInterest
            interestedCourseId={lead.interestedCourseId || undefined}
            interestedGroupId={lead.interestedGroupId || undefined}
            courseType={lead.courseType || undefined}
            interestLevel={lead.interestLevel || undefined}
            courseName={leadCourseName}
            groupName={leadGroupName}
          />
        )}

        <div className="space-y-4">
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">{ky.common.tags}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(lead.tags || []).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    <Tag className="h-3 w-3" />{tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">{ky.common.notes}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{lead.notes || 'Эскертүүлөр жок'}</p>
            </CardContent>
          </Card>
          <ScheduledTimelineEventsCard
            leadId={lead.id}
            contactId={lead.contactId || undefined}
            refreshKey={scheduleRefreshKey}
          />
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        if (!open) {
          resetEditForm();
          return;
        }
        setIsEditOpen(open);
      }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{ky.common.edit}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{ky.common.name} *</Label>
                <Input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{ky.common.phone} *</Label>
                <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{ky.common.email}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{ky.leads.source} *</Label>
                <Select value={form.source} onValueChange={(value) => setForm((prev) => ({ ...prev, source: value as LeadSource }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Булак тандаңыз" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSourceOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{ky.common.status}</Label>
                <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={ky.common.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStatusOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{ky.leads.assignedManager}</Label>
                {canAssignToSales ? (
                  <Select value={form.assignedManagerId || '__none__'} onValueChange={(value) => setForm((prev) => ({ ...prev, assignedManagerId: value === '__none__' ? '' : value }))} disabled={managersLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={managersLoading ? 'Жүктөлүүдө...' : 'Жооптуу sales тандаңыз'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Тандалган эмес</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={String(manager.id)}>
                          {manager.id === user?.id ? `${manager.fullName} (Мен)` : manager.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                    {lead.assignedManager?.fullName || 'Owner дайындалган эмес'}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{ky.common.notes}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} />
            </div>
            {isLmsBridgeEnabled ? (
              <>
                <LmsCourseContextFields
                  value={{
                    lmsCourseId: form.interestedCourseId,
                    lmsGroupId: form.interestedGroupId,
                    courseType: form.courseType,
                    courseNameSnapshot: '',
                    groupNameSnapshot: '',
                  }}
                  onChange={(next) => setForm((prev) => ({
                    ...prev,
                    interestedCourseId: next.lmsCourseId,
                    interestedGroupId: next.lmsGroupId,
                    courseType: next.courseType,
                  }))}
                  courseLabel="Кызыккан курс"
                  groupLabel="Кызыккан группа"
                  description="Бул тандоо кийинки келишимди алдын ала толтурууга колдонулат. Кааласаңыз бош калтырыңыз."
                />
                <div className="space-y-2">
                  <Label>Кызыгуу деңгээли</Label>
                  <Select
                    value={form.interestLevel || '__none__'}
                    onValueChange={(value) => setForm((prev) => ({
                      ...prev,
                      interestLevel: value === '__none__' ? '' : (value as LeadDetailFormState['interestLevel']),
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Кызыгуу деңгээлин тандаңыз" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Тандалган эмес</SelectItem>
                      <SelectItem value="low">{leadInterestLevelLabels.low}</SelectItem>
                      <SelectItem value="medium">{leadInterestLevelLabels.medium}</SelectItem>
                      <SelectItem value="high">{leadInterestLevelLabels.high}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetEditForm} disabled={isSaving}>
              {ky.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.fullName || !form.phone || !form.source}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSaving && <Save className="mr-2 h-4 w-4" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isScheduleOpen && (
        <ScheduleTimelineEventDialog
          open={isScheduleOpen}
          onOpenChange={setIsScheduleOpen}
          defaultType="call"
          leadId={lead.id}
          contactId={lead.contactId || undefined}
          onSaved={() => setScheduleRefreshKey((prev) => prev + 1)}
        />
      )}
      {isAiDraftsEnabled ? (
        <AiDraftModal
          open={isAiDraftOpen}
          onOpenChange={setIsAiDraftOpen}
          targetType="lead"
          targetId={lead.id}
          targetName={lead.fullName}
          onUseDraft={handleUseDraft}
        />
      ) : null}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-muted p-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
