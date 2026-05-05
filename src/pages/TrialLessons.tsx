import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ky } from '@/lib/i18n';
import type { Contact, Deal, Lead, TrialLesson, TrialResult } from '@/types';
import { contactApi, dealsApi, leadsApi, trialLessonsApi } from '@/api/modules';
import { Plus, Trash2, Loader2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';
import { useLmsBridge } from '@/components/lms/LmsBridgeProvider';
import { LmsCourseContextFields } from '@/components/lms/LmsCourseContextFields';
import { formatLmsCourseType } from '@/lib/lms-formatting';
import type { LmsCourseType } from '@/types/lms';
import { useLmsCourses } from '@/hooks/use-lms';

const trialResultVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'info' as const;
    case 'attended':
    case 'passed':
      return 'success' as const;
    case 'failed':
      return 'destructive' as const;
    case 'missed':
      return 'warning' as const;
    default:
      return 'default' as const;
  }
};

type TrialLessonFormState = {
  leadId: string;
  contactId: string;
  dealId: string;
  scheduledAt: string;
  result: TrialResult;
  notes: string;
  trialTopic: string;
  lmsCourseId: string;
  lmsGroupId: string;
  courseType: LmsCourseType | '';
};

const emptyForm: TrialLessonFormState = {
  leadId: '',
  contactId: '',
  dealId: '',
  scheduledAt: '',
  result: 'pending',
  notes: '',
  trialTopic: '',
  lmsCourseId: '',
  lmsGroupId: '',
  courseType: '',
};

function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TrialLessonsPage() {
  const { toast } = useToast();
  const { isLmsBridgeEnabled } = useLmsBridge();
  const [searchParams, setSearchParams] = useSearchParams();
  const getSearchParam = (key: string, fallback = '') => searchParams.get(key) ?? fallback;
  const getPageParam = () => {
    const value = Number(searchParams.get('page'));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  };
  const [trials, setTrials] = useState<TrialLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(() => getSearchParam('q'));
  const [resultFilter, setResultFilter] = useState<TrialResult | 'all'>(() => {
    const value = getSearchParam('result', 'all');
    return value === 'pending' || value === 'attended' || value === 'missed' || value === 'passed' || value === 'failed'
      ? value
      : 'all';
  });
  const [page, setPage] = useState(() => getPageParam());
  const [totalPages, setTotalPages] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<TrialLesson | null>(null);
  const [editTarget, setEditTarget] = useState<TrialLesson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<TrialLessonFormState>(emptyForm);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const { data: coursesData } = useLmsCourses(isLmsBridgeEnabled ? { isActive: 'true' } : undefined);
  const courseNameById = useMemo(
    () => new Map((coursesData?.items ?? []).map((course) => [course.id, course.name])),
    [coursesData?.items],
  );

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowEditor(true);
  };

  const openEdit = (trial: TrialLesson) => {
    setEditTarget(trial);
    setForm({
      leadId: trial.leadId ? String(trial.leadId) : '',
      contactId: trial.contactId ? String(trial.contactId) : '',
      dealId: trial.dealId ? String(trial.dealId) : '',
      scheduledAt: toDateTimeLocalValue(trial.scheduledAt),
      result: trial.result,
      notes: trial.notes || '',
      trialTopic: trial.trialTopic || '',
      lmsCourseId: trial.lmsCourseId || '',
      lmsGroupId: trial.lmsGroupId || '',
      courseType: trial.courseType || '',
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditTarget(null);
    setForm(emptyForm);
  };

  const fetchTrials = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    trialLessonsApi.list({
      search,
      result: resultFilter === 'all' ? undefined : resultFilter,
      page,
      limit: 20,
    })
      .then((res) => {
        setTrials(res.items);
        setTotalItems(res.total || 0);
        setTotalPages(Math.max(res.totalPages || 1, 1));
      })
      .catch(() => {
        setTrials([]);
        setTotalItems(0);
        setTotalPages(1);
        setLoadError('Интернет байланышын текшерип, кайра аракет кылыңыз');
        toast({
          title: 'Тизмени жүктөө мүмкүн болгон жок',
          description: 'Интернет байланышын текшерип, кайра аракет кылыңыз',
          variant: 'destructive',
        });
      })
      .finally(() => setIsLoading(false));
  }, [page, resultFilter, search, toast]);

  useEffect(() => {
    fetchTrials();
  }, [fetchTrials]);

  useEffect(() => {
    setPage(1);
  }, [resultFilter, search]);

  useEffect(() => {
    const nextSearch = searchParams.get('q') ?? '';
    const nextPage = getPageParam();
    const nextResult = searchParams.get('result') ?? 'all';

    if (nextSearch !== search) setSearch(nextSearch);
    if (nextPage !== page) setPage(nextPage);
    if (nextResult !== resultFilter && (nextResult === 'all' || nextResult === 'pending' || nextResult === 'attended' || nextResult === 'missed' || nextResult === 'passed' || nextResult === 'failed')) {
      setResultFilter(nextResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (search) next.set('q', search);
      else next.delete('q');

      if (resultFilter !== 'all') next.set('result', resultFilter);
      else next.delete('result');

      if (page > 1) next.set('page', String(page));
      else next.delete('page');

      return next.toString() === current.toString() ? current : next;
    }, { replace: true });
  }, [page, resultFilter, search, setSearchParams]);

  const fetchAllPages = useCallback(async function fetchAllPages<T>(
    fetchPage: (pageNumber: number) => Promise<{ items: T[]; totalPages?: number }>
  ): Promise<T[]> {
    const firstPage = await fetchPage(1);
    const collectedItems = [...firstPage.items];
    const pageCount = Math.max(firstPage.totalPages || 1, 1);

    for (let pageNumber = 2; pageNumber <= pageCount; pageNumber += 1) {
      const response = await fetchPage(pageNumber);
      collectedItems.push(...response.items);
    }

    return collectedItems;
  }, []);

  useEffect(() => {
    if (!showEditor) return;
    setOptionsLoading(true);
    Promise.all([
      fetchAllPages((pageNumber) => leadsApi.list({ page: pageNumber, limit: 100 })),
      fetchAllPages((pageNumber) => contactApi.list({ page: pageNumber, limit: 100 })),
      fetchAllPages((pageNumber) => dealsApi.list({ page: pageNumber, limit: 100 })),
    ])
      .then(([allLeads, allContacts, allDeals]) => {
        setLeads(allLeads);
        setContacts(allContacts);
        setDeals(allDeals);
      })
      .catch(() => {
        setLeads([]);
        setContacts([]);
        setDeals([]);
      })
      .finally(() => setOptionsLoading(false));
  }, [fetchAllPages, showEditor]);

  useEffect(() => {
    if (!form.leadId) return;
    const selectedLead = leads.find((lead) => String(lead.id) === form.leadId);
    if (!selectedLead?.contactId) return;

    setForm((prev) => ({
      ...prev,
      contactId: prev.contactId || String(selectedLead.contactId),
      lmsCourseId: prev.lmsCourseId || selectedLead.interestedCourseId || '',
      lmsGroupId: prev.lmsGroupId || selectedLead.interestedGroupId || '',
      courseType: prev.courseType || selectedLead.courseType || '',
    }));
  }, [form.leadId, leads]);

  useEffect(() => {
    if (!form.dealId) return;
    const selectedDeal = deals.find((deal) => String(deal.id) === form.dealId);
    if (!selectedDeal?.contactId) return;

    setForm((prev) => ({
      ...prev,
      contactId: String(selectedDeal.contactId),
      leadId: selectedDeal.leadId ? String(selectedDeal.leadId) : prev.leadId,
      lmsCourseId: prev.lmsCourseId || selectedDeal.lmsMapping?.lmsCourseId || '',
      lmsGroupId: prev.lmsGroupId || selectedDeal.lmsMapping?.lmsGroupId || '',
      courseType: prev.courseType || selectedDeal.lmsMapping?.courseType || '',
    }));
  }, [deals, form.dealId]);

  const handleSave = async () => {
    if (!form.contactId || !form.scheduledAt) return;
    setIsSaving(true);
    try {
      const payload = {
        leadId: form.leadId ? Number(form.leadId) : undefined,
        contactId: Number(form.contactId),
        dealId: form.dealId ? Number(form.dealId) : undefined,
        scheduledAt: form.scheduledAt,
        result: form.result,
        notes: form.notes || undefined,
        trialTopic: form.trialTopic || undefined,
        lmsCourseId: isLmsBridgeEnabled ? form.lmsCourseId : undefined,
        lmsGroupId: isLmsBridgeEnabled ? form.lmsGroupId : undefined,
        courseType: isLmsBridgeEnabled ? form.courseType || undefined : undefined,
      };

      if (editTarget) {
        await trialLessonsApi.update(editTarget.id, payload);
        toast({ title: 'Сыноо сабагы жаңыртылды' });
      } else {
        await trialLessonsApi.create(payload);
        toast({ title: 'Сыноо сабагы ийгиликтүү кошулду' });
      }

      closeEditor();
      fetchTrials();
    } catch (error) {
      const friendly = getFriendlyError(error, {
        fallbackTitle: editTarget ? 'Сыноо сабагын жаңыртуу ишке ашкан жок' : 'Сыноо сабагын сактоо ишке ашкан жок',
      });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await trialLessonsApi.delete(deleteTarget.id);
      toast({ title: ky.trialLessons.deleteSuccess });
      setDeleteTarget(null);
      fetchTrials();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: ky.trialLessons.deleteError });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCourseSummary = (trial: TrialLesson) => {
    if (!trial.lmsCourseId) return '—';
    const courseName = courseNameById.get(trial.lmsCourseId);
    if (courseName) {
      return `${courseName}${trial.lmsGroupId ? ' • группа бар' : ''}`;
    }
    return `${formatLmsCourseType(trial.courseType)}${trial.lmsGroupId ? ' • группа бар' : ''}`;
  };

  const columns: Column<TrialLesson>[] = [
    {
      key: 'contact',
      header: 'Студент',
      render: (trial) => <span className="font-medium">{trial.contact?.fullName || '—'}</span>,
    },
    {
      key: 'scheduledAt',
      header: ky.trialLessons.scheduledAt,
      render: (trial) => new Date(trial.scheduledAt).toLocaleString('ky-KG', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      key: 'trialTopic',
      header: 'Тема',
      render: (trial) => <span className="text-sm">{trial.trialTopic || '—'}</span>,
      className: 'hidden md:table-cell',
    },
    {
      key: 'courseType',
      header: 'Курс',
      render: (trial) => <span className="text-sm">{formatCourseSummary(trial)}</span>,
      className: 'hidden lg:table-cell',
    },
    {
      key: 'result',
      header: ky.trialLessons.result,
      render: (trial) => <StatusBadge variant={trialResultVariant(trial.result)} dot>{ky.trialResult[trial.result]}</StatusBadge>,
    },
    {
      key: 'notes',
      header: ky.common.notes,
      render: (trial) => <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{trial.notes || '—'}</span>,
      className: 'hidden md:table-cell',
    },
    {
      key: 'actions',
      header: '',
      render: (trial) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(event) => {
              event.stopPropagation();
              openEdit(trial);
            }}
            aria-label={`${trial.contact?.fullName || 'Сыноо сабак'} өзгөртүү`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(trial);
            }}
            aria-label={`${ky.common.delete} ${trial.contact?.fullName || ''}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const mobileBoardColumns = Object.entries(ky.trialResult).map(([value, label]) => ({ id: value, title: label }));
  const activeFilters = [
    ...(search.trim()
      ? [{
        key: 'search',
        label: `Издөө: ${search.trim()}`,
        onRemove: () => setSearch(''),
      }]
      : []),
    ...(resultFilter !== 'all'
      ? [{
        key: 'result',
        label: `Жыйынтык: ${ky.trialResult[resultFilter]}`,
        onRemove: () => setResultFilter('all'),
      }]
      : []),
  ];

  const renderMobileCard = (trial: TrialLesson) => (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{trial.contact?.fullName || '—'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(trial.scheduledAt).toLocaleString('ky-KG', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
        <StatusBadge variant={trialResultVariant(trial.result)} dot>
          {ky.trialResult[trial.result]}
        </StatusBadge>
      </div>

      {(trial.trialTopic || trial.notes || trial.lmsCourseId) && (
        <div className="mt-3 space-y-2">
          {trial.trialTopic ? <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">{trial.trialTopic}</p> : null}
          {trial.lmsCourseId ? <p className="text-xs text-muted-foreground">Курс: {formatCourseSummary(trial)}</p> : null}
          {trial.notes ? <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">{trial.notes}</p> : null}
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            openEdit(trial);
          }}
        >
          Өзгөртүү
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            setDeleteTarget(trial);
          }}
          aria-label={`${ky.common.delete} ${trial.contact?.fullName || ''}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.trialLessons.title} actions={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />{ky.trialLessons.newTrialLesson}</Button>} />
      <DataTable
        columns={columns}
        data={trials}
        isLoading={isLoading}
        errorMessage={loadError || undefined}
        onRetry={fetchTrials}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Сыноо сабагын аты, телефон, тема, ID же эскертүү менен издөө..."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        headerActions={(
          <Select value={resultFilter} onValueChange={(value) => setResultFilter(value as TrialResult | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Жыйынтык" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бардык жыйынтык</SelectItem>
              {Object.entries(ky.trialResult).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        activeFilters={activeFilters}
        totalItems={totalItems}
        totalItemsLabel="сыноо сабагы"
        stickyHeader
        onRowClick={openEdit}
        renderMobileCard={renderMobileCard}
        mobileBoardColumns={mobileBoardColumns}
        getMobileBoardColumnId={(trial) => trial.result}
        mobileBoardEmptyMessage="Бул тилкеде сыноо сабагы жок"
      />

      <Dialog open={showEditor} onOpenChange={(open) => {
        if (!open) {
          closeEditor();
          return;
        }
        setShowEditor(open);
      }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editTarget ? 'Сыноо сабагын өзгөртүү' : ky.trialLessons.newTrialLesson}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Лид</Label>
              <Select
                value={form.leadId || '__none__'}
                onValueChange={(value) => setForm((prev) => ({ ...prev, leadId: value === '__none__' ? '' : value }))}
                disabled={optionsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={optionsLoading ? 'Жүктөлүүдө...' : 'Лид тандаңыз'} />
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
              <Select
                value={form.contactId || '__none__'}
                onValueChange={(value) => setForm((prev) => ({ ...prev, contactId: value === '__none__' ? '' : value }))}
                disabled={optionsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={optionsLoading ? 'Жүктөлүүдө...' : 'Байланыш тандаңыз'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Тандалган эмес</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={String(contact.id)}>
                      {contact.fullName} {contact.phone ? `• ${contact.phone}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Келишим</Label>
              <Select
                value={form.dealId || '__none__'}
                onValueChange={(value) => setForm((prev) => ({ ...prev, dealId: value === '__none__' ? '' : value }))}
                disabled={optionsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={optionsLoading ? 'Жүктөлүүдө...' : 'Келишим тандаңыз'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Тандалган эмес</SelectItem>
                  {deals.map((deal) => (
                    <SelectItem key={deal.id} value={String(deal.id)}>
                      #{deal.id} {deal.contact?.fullName ? `• ${deal.contact.fullName}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{ky.trialLessons.scheduledAt} *</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{ky.trialLessons.result}</Label>
                <Select value={form.result} onValueChange={(value) => setForm((prev) => ({ ...prev, result: value as TrialResult }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ky.trialResult).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Сыноо темасы</Label>
              <Input value={form.trialTopic} onChange={(event) => setForm({ ...form, trialTopic: event.target.value })} placeholder="Мисалы: React кириш сабагы" />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.notes}</Label>
              <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Эскертүүлөр..." />
            </div>
            {isLmsBridgeEnabled ? (
              <LmsCourseContextFields
                value={{
                  lmsCourseId: form.lmsCourseId,
                  lmsGroupId: form.lmsGroupId,
                  courseType: form.courseType,
                  courseNameSnapshot: '',
                  groupNameSnapshot: '',
                }}
                onChange={(next) => setForm((prev) => ({
                  ...prev,
                  lmsCourseId: next.lmsCourseId,
                  lmsGroupId: next.lmsGroupId,
                  courseType: next.courseType,
                }))}
                courseLabel="Сыноо үчүн курс"
                groupLabel="Сыноо үчүн группа"
                description="Лид же келишим тандалса, бул бөлүктү бош калтырсаңыз система кызыгуу же келишим контекстин колдонууга аракет кылат."
              />
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditor}>{ky.common.cancel}</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.contactId || !form.scheduledAt}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editTarget ? 'Сактоо' : ky.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ky.trialLessons.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{ky.trialLessons.deleteConfirmDesc}</AlertDialogDescription>
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
