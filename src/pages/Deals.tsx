import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ky } from '@/lib/i18n';
import { contactApi, dealsApi, leadsApi, tasksApi, trialLessonsApi } from '@/api/modules';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useLmsBridge } from '@/components/lms/LmsBridgeProvider';
import { useTenantConfig } from '@/components/core/TenantConfigProvider';
import type { Contact, Deal, DealPipelineStage, Lead, TrialLesson } from '@/types';
import type { LmsCourseType } from '@/types/lms';
import { getDealPipelineStage, mapPipelineToDealStage } from '@/lib/crm-status';
import { Plus, Trash2, Loader2, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { getFriendlyError } from '@/lib/error-messages';
import { LmsCourseContextFields } from '@/components/lms/LmsCourseContextFields';
import { useLmsCourses, useLmsGroups } from '@/hooks/use-lms';

type DealCreateFormState = {
  leadId: string;
  contactId: string;
  trialLessonId: string;
  amount: string;
  currency: string;
  pipelineStage: DealPipelineStage;
  notes: string;
  lmsCourseId: string;
  lmsGroupId: string;
  courseType: LmsCourseType | '';
  courseNameSnapshot: string;
  groupNameSnapshot: string;
  initialTaskTitle: string;
  initialTaskDescription: string;
  initialTaskDueAt: string;
};

const emptyForm: DealCreateFormState = {
  leadId: '',
  contactId: '',
  trialLessonId: '',
  amount: '',
  currency: 'KGS',
  pipelineStage: 'new' as DealPipelineStage,
  notes: '',
  lmsCourseId: '',
  lmsGroupId: '',
  courseType: '',
  courseNameSnapshot: '',
  groupNameSnapshot: '',
  initialTaskTitle: '',
  initialTaskDescription: '',
  initialTaskDueAt: '',
};

function normalizeCourseType(value?: string | null): LmsCourseType | '' {
  return value === 'video' || value === 'offline' || value === 'online_live' ? value : '';
}

export default function DealsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { canViewLmsTechnicalFields } = useRolePermissions();
  const { isLmsBridgeEnabled } = useLmsBridge();
  const { tenantConfig } = useTenantConfig();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [trialLessons, setTrialLessons] = useState<TrialLesson[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [updatingDealId, setUpdatingDealId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const prefillLeadId = searchParams.get('leadId') || '';
  const prefillContactId = searchParams.get('contactId') || '';
  const prefillTrialLessonId = searchParams.get('trialLessonId') || '';
  const prefillCourseId = searchParams.get('courseId') || '';
  const prefillGroupId = searchParams.get('groupId') || '';
  const prefillCourseType = searchParams.get('courseType') || '';
  const prefillCourseName = searchParams.get('courseName') || '';
  const prefillGroupName = searchParams.get('groupName') || '';
  const shouldOpenCreate = searchParams.get('create') === '1';
  const { data: coursesData } = useLmsCourses(isLmsBridgeEnabled ? { isActive: 'true' } : undefined);
  const courses = coursesData?.items ?? [];
  const selectedFormCourse = courses.find((course) => course.id === form.lmsCourseId) ?? null;
  const { data: groupsData } = useLmsGroups(
    isLmsBridgeEnabled && form.lmsCourseId && selectedFormCourse?.courseType !== 'video'
      ? { courseId: form.lmsCourseId, limit: 100 }
      : undefined,
  );
  const groups = groupsData?.items ?? [];

  // Use tenant-configured pipeline stages if available, otherwise use hardcoded stages
  const pipelineStageOptions = useMemo(() => {
    if (tenantConfig.pipelineStages && tenantConfig.pipelineStages.length > 0) {
      return tenantConfig.pipelineStages.map(stage => ({
        value: stage.key,
        label: stage.label,
      }));
    }
    // Fallback to hardcoded stages
    return Object.entries(ky.dealPipelineStage).map(([value, label]) => ({
      value,
      label,
    }));
  }, [tenantConfig.pipelineStages]);

  const clearPrefillParams = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('create');
      next.delete('leadId');
      next.delete('contactId');
      next.delete('trialLessonId');
      next.delete('courseId');
      next.delete('courseType');
      next.delete('groupId');
      next.delete('courseName');
      next.delete('groupName');
      return next;
    }, { replace: true });
  };

  const resetCreateForm = () => {
    setForm(emptyForm);
    clearPrefillParams();
    setShowCreate(false);
  };

  const fetchDeals = () => {
    setIsLoading(true);
    setLoadError(null);
    dealsApi.list({ search })
      .then((res) => {
        setDeals(res.items);
        setTotalItems(res.total || 0);
      })
      .catch(() => {
        setDeals([]);
        setTotalItems(0);
        setLoadError('Интернет байланышын текшерип, кайра аракет кылыңыз');
        toast({
          title: 'Тизмени жүктөө мүмкүн болгон жок',
          description: 'Интернет байланышын текшерип, кайра аракет кылыңыз',
          variant: 'destructive',
        });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchDeals(); }, [search]);

  useEffect(() => {
    if (!showCreate) return;
    setContactsLoading(true);
    Promise.all([
      contactApi.list({ page: 1, limit: 100 }),
      leadsApi.list({ page: 1, limit: 100 }),
      trialLessonsApi.list({ page: 1, limit: 100 }),
    ])
      .then(([contactsRes, leadsRes, trialsRes]) => {
        setContacts(contactsRes.items);
        setLeads(leadsRes.items);
        setTrialLessons(trialsRes.items);
      })
      .catch(() => {
        setContacts([]);
        setLeads([]);
        setTrialLessons([]);
      })
      .finally(() => setContactsLoading(false));
  }, [showCreate]);

  useEffect(() => {
    if (!shouldOpenCreate) return;
    setShowCreate(true);
  }, [shouldOpenCreate]);

  useEffect(() => {
    if (!showCreate) return;
    setForm((prev) => ({
      ...prev,
      leadId: prefillLeadId || prev.leadId,
      contactId: prefillContactId || prev.contactId,
      trialLessonId: prefillTrialLessonId || prev.trialLessonId,
      lmsCourseId: prefillCourseId || prev.lmsCourseId,
      lmsGroupId: prefillGroupId || prev.lmsGroupId,
      courseType: normalizeCourseType(prefillCourseType) || prev.courseType,
      courseNameSnapshot: prefillCourseName || prev.courseNameSnapshot,
      groupNameSnapshot: prefillGroupName || prev.groupNameSnapshot,
    }));
  }, [showCreate, prefillContactId, prefillCourseId, prefillCourseName, prefillCourseType, prefillGroupId, prefillGroupName, prefillLeadId, prefillTrialLessonId]);

  const handleContactChange = (value: string) => {
    setForm((prev) => ({ ...prev, contactId: value }));
  };

  useEffect(() => {
    if (!form.leadId) return;
    const selectedLead = leads.find((lead) => String(lead.id) === form.leadId);
    if (!selectedLead?.contactId) return;

    setForm((prev) => (
      {
        ...prev,
        contactId: prev.contactId || String(selectedLead.contactId),
        lmsCourseId: prev.lmsCourseId || selectedLead.interestedCourseId || '',
        lmsGroupId: prev.lmsGroupId || selectedLead.interestedGroupId || '',
        courseType: prev.courseType || normalizeCourseType(selectedLead.courseType),
      }
    ));
  }, [form.leadId, leads]);

  useEffect(() => {
    if (!form.trialLessonId) return;
    const selectedTrial = trialLessons.find((trial) => String(trial.id) === form.trialLessonId);
    if (!selectedTrial) return;

    setForm((prev) => ({
      ...prev,
      leadId: selectedTrial.leadId ? String(selectedTrial.leadId) : prev.leadId,
      contactId: selectedTrial.contactId ? String(selectedTrial.contactId) : prev.contactId,
      lmsCourseId: prev.lmsCourseId || selectedTrial.lmsCourseId || '',
      lmsGroupId: prev.lmsGroupId || selectedTrial.lmsGroupId || '',
      courseType: prev.courseType || normalizeCourseType(selectedTrial.courseType),
    }));
  }, [form.trialLessonId, trialLessons]);

  useEffect(() => {
    if (!form.lmsCourseId) return;
    const selectedCourse = courses.find((course) => course.id === form.lmsCourseId);
    if (!selectedCourse) return;

    setForm((prev) => (
      prev.courseNameSnapshot === selectedCourse.name
        ? prev
        : { ...prev, courseNameSnapshot: prev.courseNameSnapshot || selectedCourse.name }
    ));
  }, [courses, form.lmsCourseId]);

  useEffect(() => {
    if (!form.lmsCourseId || !form.lmsGroupId) return;
    const selectedGroup = groups.find((group) => group.id === form.lmsGroupId);
    if (!selectedGroup) return;

    setForm((prev) => (
      prev.groupNameSnapshot === selectedGroup.name
        ? prev
        : { ...prev, groupNameSnapshot: prev.groupNameSnapshot || selectedGroup.name }
    ));
  }, [form.lmsCourseId, form.lmsGroupId, groups]);

  const handleCreate = async () => {
    if (!form.contactId || !form.amount || !form.initialTaskTitle.trim()) return;
    setIsCreating(true);
    try {
      const deal = await dealsApi.create({
        contactId: Number(form.contactId),
        leadId: form.leadId ? Number(form.leadId) : undefined,
        trialLessonId: form.trialLessonId ? Number(form.trialLessonId) : undefined,
        amount: Number(form.amount),
        currency: form.currency,
        pipelineStage: form.pipelineStage,
        notes: form.notes || undefined,
        lmsCourseId: isLmsBridgeEnabled ? form.lmsCourseId || undefined : undefined,
        lmsGroupId: isLmsBridgeEnabled ? form.lmsGroupId || undefined : undefined,
        courseType: isLmsBridgeEnabled ? form.courseType || undefined : undefined,
        courseNameSnapshot: isLmsBridgeEnabled ? form.courseNameSnapshot || undefined : undefined,
        groupNameSnapshot: isLmsBridgeEnabled ? form.groupNameSnapshot || undefined : undefined,
      });
      await tasksApi.create({
        title: form.initialTaskTitle.trim(),
        description: form.initialTaskDescription || 'Келишим боюнча кийинки кадам',
        dueAt: form.initialTaskDueAt || undefined,
        contactId: Number(form.contactId),
        dealId: deal.id,
      });
      toast({ title: 'Келишим ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      clearPrefillParams();
      fetchDeals();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Келишимди сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await dealsApi.delete(deleteTarget.id);
      toast({ title: ky.deals.deleteSuccess });
      setDeleteTarget(null);
      fetchDeals();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: ky.deals.deleteError });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePipelineChange = async (deal: Deal, pipelineStage: DealPipelineStage) => {
    setUpdatingDealId(deal.id);
    try {
      const updatedDeal = await dealsApi.update(deal.id, {
        pipelineStage,
        stage: mapPipelineToDealStage(pipelineStage, tenantConfig.pipelineStages),
      });
      setDeals((current) => current.map((item) => (item.id === deal.id ? updatedDeal : item)));
      toast({ title: 'Келишимдин этабы жаңыртылды' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Келишимдин этабын жаңыртуу мүмкүн болгон жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setUpdatingDealId(null);
    }
  };

  const getDealQuickActions = (deal: Deal): Array<{ value: DealPipelineStage; label: string }> => {
    const stage = getDealPipelineStage(deal, tenantConfig.pipelineStages);
    const stages = tenantConfig.pipelineStages || [];
    const currentStage = stages.find(s => s.key === stage);

    if (!currentStage) {
      return [];
    }

    const actions: Array<{ value: DealPipelineStage; label: string }> = [];

    // Find next stage in order
    const nextStage = stages
      .filter(s => s.order > currentStage.order)
      .sort((a, b) => a.order - b.order)[0];

    if (nextStage) {
      actions.push({ value: nextStage.key as DealPipelineStage, label: nextStage.label });
    }

    // Add "lost" option from any non-lost stage
    if (stage !== 'lost') {
      const lostStage = stages.find(s => s.key === 'lost');
      if (lostStage) {
        actions.push({ value: 'lost', label: lostStage.label });
      }
    }

    // Add previous stage option (to allow going back)
    const previousStage = stages
      .filter(s => s.order < currentStage.order)
      .sort((a, b) => b.order - a.order)[0];

    if (previousStage && stage !== 'lost') {
      actions.push({ value: previousStage.key as DealPipelineStage, label: `Кайра: ${previousStage.label}` });
    }

    // Special case: if current is lost, allow reopening to first stage
    if (stage === 'lost') {
      const firstStage = stages.sort((a, b) => a.order - b.order)[0];
      if (firstStage) {
        actions.push({ value: firstStage.key as DealPipelineStage, label: `Кайра ачуу: ${firstStage.label}` });
      }
    }

    return actions;
  };

  const columns: Column<Deal>[] = [
    { key: 'contact', header: 'Студент', render: (d) => <span className="font-medium">{d.contact?.fullName || '—'}</span> },
    { key: 'amount', header: ky.deals.amount, render: (d) => <span className="font-medium">{d.amount.toLocaleString()} {tenantConfig.currency}</span> },
    { key: 'stage', header: ky.deals.stage, render: (d) => { const stage = getDealPipelineStage(d, tenantConfig.pipelineStages); return <StatusBadge variant={getLeadStatusVariant(stage)} dot>{pipelineStageOptions.find(opt => opt.value === stage)?.label || ky.dealPipelineStage[stage]}</StatusBadge>; } },
    {
      key: 'actions', header: '', render: (d) => (
        <div className="flex items-center justify-end gap-1">
          <Select
            value={getDealPipelineStage(d, tenantConfig.pipelineStages)}
            onValueChange={(value) => handlePipelineChange(d, value as DealPipelineStage)}
            disabled={updatingDealId === d.id}
          >
            <SelectTrigger
              className="h-8 w-[148px]"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${d.contact?.fullName || 'Келишим'} этабын өзгөртүү`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipelineStageOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLmsBridgeEnabled && canViewLmsTechnicalFields() && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/enrollments?crmDealId=${d.id}`);
              }}
              aria-label={`${d.contact?.fullName || 'Келишим'} үчүн LMS каттоону ачуу`}
            >
              <GraduationCap className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(d); }} aria-label={`${ky.common.delete} ${d.contact?.fullName || 'келишим'}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
  const mobileBoardColumns = pipelineStageOptions.map(({ value, label }) => ({ id: value, title: label }));
  const activeFilters = search.trim()
    ? [{
      key: 'search',
      label: `Издөө: ${search.trim()}`,
      onRemove: () => setSearch(''),
    }]
    : [];
  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="hidden items-center gap-2 text-xs text-muted-foreground xl:flex">
        <span className="rounded-full bg-secondary px-2.5 py-1">{totalItems} келишим</span>
        <span className="rounded-full bg-secondary px-2.5 py-1">
          {deals.filter((deal) => getDealPipelineStage(deal, tenantConfig.pipelineStages) === 'payment_pending').length} төлөм күтөт
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1">
          {deals.filter((deal) => getDealPipelineStage(deal, tenantConfig.pipelineStages) === 'won').length} ийгиликтүү
        </span>
      </div>
    </div>
  );

  const renderMobileCard = (deal: Deal) => {
    const stage = getDealPipelineStage(deal, tenantConfig.pipelineStages);
    const quickActions = getDealQuickActions(deal);

    return (
      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{deal.contact?.fullName || '—'}</p>
          </div>
          <StatusBadge variant={getLeadStatusVariant(stage)} dot>
            {pipelineStageOptions.find(opt => opt.value === stage)?.label || ky.dealPipelineStage[stage]}
          </StatusBadge>
        </div>

        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{deal.amount.toLocaleString()} {tenantConfig.currency}</p>
          <p>{deal.notes || 'Кошумча эскертүү жок'}</p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/deals/${deal.id}`);
            }}
          >
            {ky.common.view}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(deal);
              }}
              aria-label={`${ky.common.delete} ${deal.contact?.fullName || ''}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {quickActions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
            {quickActions.map((action) => (
              <Button
                key={action.value}
                variant="secondary"
                size="sm"
                disabled={updatingDealId === deal.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePipelineChange(deal, action.value);
                }}
              >
                {updatingDealId === deal.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title={ky.deals.title} description="Келишимдерди баскычтан баскычка тез жылдырып, төлөмгө чейин жеткириңиз." actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.deals.newDeal}</Button>} />
      <DataTable
        columns={columns}
        data={deals}
        isLoading={isLoading}
        errorMessage={loadError || undefined}
        onRetry={fetchDeals}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Келишим издөө..."
        headerActions={headerActions}
        activeFilters={activeFilters}
        totalItems={totalItems}
        totalItemsLabel="келишим"
        stickyHeader
        onRowClick={(deal) => navigate(`/deals/${deal.id}`)}
        renderMobileCard={renderMobileCard}
        mobileBoardColumns={mobileBoardColumns}
        getMobileBoardColumnId={(deal) => getDealPipelineStage(deal, tenantConfig.pipelineStages)}
        mobileBoardEmptyMessage="Бул этапта келишим жок"
      />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => {
        setShowCreate(open);
        if (!open) clearPrefillParams();
      }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{ky.deals.newDeal}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Лид</Label>
                <Select value={form.leadId || '__none__'} onValueChange={(value) => setForm((prev) => ({ ...prev, leadId: value === '__none__' ? '' : value }))} disabled={contactsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={contactsLoading ? 'Жүктөлүүдө...' : 'Лид тандаңыз'} />
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
              </div>
              <div className="space-y-2">
                <Label>Байланыш *</Label>
                <Select value={form.contactId} onValueChange={handleContactChange} disabled={contactsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={contactsLoading ? 'Жүктөлүүдө...' : 'Байланыш тандаңыз'} />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={String(contact.id)}>
                        {contact.fullName} {contact.phone ? `• ${contact.phone}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Сыноо сабагы</Label>
                <Select value={form.trialLessonId || '__none__'} onValueChange={(value) => setForm((prev) => ({ ...prev, trialLessonId: value === '__none__' ? '' : value }))} disabled={contactsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={contactsLoading ? 'Жүктөлүүдө...' : 'Сыноо сабагын тандаңыз'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Тандалган эмес</SelectItem>
                    {trialLessons.map((trial) => (
                      <SelectItem key={trial.id} value={String(trial.id)}>
                        #{trial.id} {trial.contact?.fullName ? `• ${trial.contact.fullName}` : ''} {trial.trialTopic ? `• ${trial.trialTopic}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{ky.deals.amount} *</Label>
                <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="15000" type="number" />
              </div>
              <div className="space-y-2">
                <Label>{ky.deals.currency}</Label>
                <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="KGS" />
              </div>
              <div className="space-y-2">
                <Label>{ky.deals.stage}</Label>
                <Select value={form.pipelineStage} onValueChange={(v) => setForm({ ...form, pipelineStage: v as DealPipelineStage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ky.dealPipelineStage).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{ky.common.notes}</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Контекст же комментарий" />
            </div>
            {isLmsBridgeEnabled ? (
              <LmsCourseContextFields
                value={{
                  lmsCourseId: form.lmsCourseId,
                  lmsGroupId: form.lmsGroupId,
                  courseType: form.courseType,
                  courseNameSnapshot: form.courseNameSnapshot,
                  groupNameSnapshot: form.groupNameSnapshot,
                }}
                onChange={(next) => setForm((prev) => ({
                  ...prev,
                  lmsCourseId: next.lmsCourseId,
                  lmsGroupId: next.lmsGroupId,
                  courseType: next.courseType,
                  courseNameSnapshot: next.courseNameSnapshot,
                  groupNameSnapshot: next.groupNameSnapshot,
                }))}
                courseLabel="Курс"
                groupLabel="Группа"
                description="Эгер лид же сыноо сабагы тандалса, бул бөлүктү бош калтырсаңыз система алардын окуу тандоосун колдонот."
              />
            ) : null}
            <div className="space-y-4 rounded-lg border border-border/60 p-4">
              <div>
                <p className="text-sm font-medium">Биринчи тапшырма</p>
                <p className="text-xs text-muted-foreground">Ар бир жаңы келишим үчүн кийинки аракет дароо пландалат.</p>
              </div>
              <div className="space-y-2">
                <Label>Тапшырма аталышы *</Label>
                <Input value={form.initialTaskTitle} onChange={(e) => setForm({ ...form, initialTaskTitle: e.target.value })} placeholder="Студентке чалуу" />
              </div>
              <div className="space-y-2">
                <Label>{ky.tasks.description}</Label>
                <Input value={form.initialTaskDescription} onChange={(e) => setForm({ ...form, initialTaskDescription: e.target.value })} placeholder="Эмне кылуу керек?" />
              </div>
              <div className="space-y-2">
                <Label>{ky.tasks.dueAt}</Label>
                <Input type="datetime-local" value={form.initialTaskDueAt} onChange={(e) => setForm({ ...form, initialTaskDueAt: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetCreateForm}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || !form.contactId || !form.amount || !form.initialTaskTitle.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ky.deals.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{ky.deals.deleteConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{ky.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {ky.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
