import { useState, useEffect } from 'react';
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
import type { Contact, Deal, Lead, TrialLesson } from '@/types';
import { contactApi, dealsApi, leadsApi, trialLessonsApi } from '@/api/modules';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';
import { useLmsBridge } from '@/components/lms/LmsBridgeProvider';
import { LmsCourseContextFields } from '@/components/lms/LmsCourseContextFields';
import { formatLmsCourseType } from '@/lib/lms-formatting';
import type { LmsCourseType } from '@/types/lms';

const trialResultVariant = (s: string) => {
  switch (s) { case 'pending': return 'info' as const; case 'attended': case 'passed': return 'success' as const; case 'failed': return 'destructive' as const; case 'missed': return 'warning' as const; default: return 'default' as const; }
};

type TrialLessonFormState = {
  leadId: string;
  contactId: string;
  dealId: string;
  scheduledAt: string;
  notes: string;
  trialTopic: string;
  lmsCourseId: string;
  lmsGroupId: string;
  courseType: LmsCourseType | '';
};

const emptyForm: TrialLessonFormState = { leadId: '', contactId: '', dealId: '', scheduledAt: '', notes: '', trialTopic: '', lmsCourseId: '', lmsGroupId: '', courseType: '' };

export default function TrialLessonsPage() {
  const { toast } = useToast();
  const { isLmsBridgeEnabled } = useLmsBridge();
  const [trials, setTrials] = useState<TrialLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<TrialLesson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const resetCreateForm = () => {
    setForm(emptyForm);
    setShowCreate(false);
  };

  const fetchTrials = () => {
    setIsLoading(true);
    setLoadError(null);
    trialLessonsApi.list({ search })
      .then((res) => {
        setTrials(res.items);
        setTotalItems(res.total || 0);
      })
      .catch(() => {
        setTrials([]);
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

  useEffect(() => { fetchTrials(); }, [search]);

  useEffect(() => {
    if (!showCreate) return;
    setOptionsLoading(true);
    Promise.all([
      leadsApi.list({ page: 1, limit: 100 }),
      contactApi.list({ page: 1, limit: 100 }),
      dealsApi.list({ page: 1, limit: 100 }),
    ])
      .then(([leadsRes, contactsRes, dealsRes]) => {
        setLeads(leadsRes.items);
        setContacts(contactsRes.items);
        setDeals(dealsRes.items);
      })
      .catch(() => {
        setLeads([]);
        setContacts([]);
        setDeals([]);
      })
      .finally(() => setOptionsLoading(false));
  }, [showCreate]);

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

    setForm((prev) => (
      {
        ...prev,
        contactId: String(selectedDeal.contactId),
        leadId: selectedDeal.leadId ? String(selectedDeal.leadId) : prev.leadId,
        lmsCourseId: prev.lmsCourseId || selectedDeal.lmsMapping?.lmsCourseId || '',
        lmsGroupId: prev.lmsGroupId || selectedDeal.lmsMapping?.lmsGroupId || '',
        courseType: prev.courseType || selectedDeal.lmsMapping?.courseType || '',
      }
    ));
  }, [deals, form.dealId]);

  const handleCreate = async () => {
    if (!form.contactId || !form.scheduledAt) return;
    setIsCreating(true);
    try {
      await trialLessonsApi.create({
        leadId: form.leadId ? Number(form.leadId) : undefined,
        contactId: Number(form.contactId),
        dealId: form.dealId ? Number(form.dealId) : undefined,
        scheduledAt: form.scheduledAt,
        notes: form.notes || undefined,
        trialTopic: form.trialTopic || undefined,
        lmsCourseId: isLmsBridgeEnabled ? form.lmsCourseId || undefined : undefined,
        lmsGroupId: isLmsBridgeEnabled ? form.lmsGroupId || undefined : undefined,
        courseType: isLmsBridgeEnabled ? form.courseType || undefined : undefined,
      });
      toast({ title: 'Сыноо сабагы ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      fetchTrials();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Сыноо сабагын сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsCreating(false);
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

  const columns: Column<TrialLesson>[] = [
    { key: 'contact', header: 'Студент', render: (t) => <span className="font-medium">{t.contact?.fullName || '—'}</span> },
    { key: 'scheduledAt', header: ky.trialLessons.scheduledAt, render: (t) => new Date(t.scheduledAt).toLocaleString('ky-KG', { dateStyle: 'short', timeStyle: 'short' }) },
    { key: 'trialTopic', header: 'Тема', render: (t) => <span className="text-sm">{t.trialTopic || '—'}</span>, className: 'hidden md:table-cell' },
    { key: 'courseType', header: 'Курс', render: (t) => <span className="text-sm">{t.lmsCourseId ? `${formatLmsCourseType(t.courseType)}${t.lmsGroupId ? ' • группа бар' : ''}` : '—'}</span>, className: 'hidden lg:table-cell' },
    { key: 'result', header: ky.trialLessons.result, render: (t) => <StatusBadge variant={trialResultVariant(t.result)} dot>{ky.trialResult[t.result]}</StatusBadge> },
    { key: 'notes', header: ky.common.notes, render: (t) => <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{t.notes || '—'}</span>, className: 'hidden md:table-cell' },
    {
      key: 'actions', header: '', render: (t) => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(t); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];
  const mobileBoardColumns = Object.entries(ky.trialResult).map(([value, label]) => ({ id: value, title: label }));
  const activeFilters = search.trim()
    ? [{
      key: 'search',
      label: `Издөө: ${search.trim()}`,
      onRemove: () => setSearch(''),
    }]
    : [];

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
          {trial.lmsCourseId ? <p className="text-xs text-muted-foreground">Курс: {formatLmsCourseType(trial.courseType)}</p> : null}
          {trial.notes ? <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">{trial.notes}</p> : null}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
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
      <PageHeader title={ky.trialLessons.title} actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.trialLessons.newTrialLesson}</Button>} />
      <DataTable
        columns={columns}
        data={trials}
        isLoading={isLoading}
        errorMessage={loadError || undefined}
        onRetry={fetchTrials}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Сыноо сабагын издөө..."
        activeFilters={activeFilters}
        totalItems={totalItems}
        totalItemsLabel="сыноо сабагы"
        stickyHeader
        renderMobileCard={renderMobileCard}
        mobileBoardColumns={mobileBoardColumns}
        getMobileBoardColumnId={(trial) => trial.result}
        mobileBoardEmptyMessage="Бул тилкеде сыноо сабагы жок"
      />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => {
        if (!open) {
          resetCreateForm();
          return;
        }
        setShowCreate(open);
      }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{ky.trialLessons.newTrialLesson}</DialogTitle></DialogHeader>
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
            <div className="space-y-2">
              <Label>{ky.trialLessons.scheduledAt} *</Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Сыноо темасы</Label>
              <Input value={form.trialTopic} onChange={(e) => setForm({ ...form, trialTopic: e.target.value })} placeholder="Мисалы: React кириш сабагы" />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.notes}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Эскертүүлөр..." />
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
                description="Лид тандалса, бул бөлүктү бош калтырсаңыз система лиддин кызыгуусун колдонууга аракет кылат."
              />
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetCreateForm}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || !form.contactId || !form.scheduledAt}>
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
