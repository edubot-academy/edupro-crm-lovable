import { useState, useEffect } from 'react';
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
import { contactApi, dealsApi, tasksApi } from '@/api/modules';
import { useLmsCourses, useLmsGroups } from '@/hooks/use-lms';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useLmsBridge } from '@/components/lms/LmsBridgeProvider';
import type { Contact, Deal, DealPipelineStage } from '@/types';
import { getDealPipelineStage, mapPipelineToDealStage } from '@/lib/crm-status';
import type { LmsCourseType } from '@/types/lms';
import { formatLmsDate, getCourseSalesSummary, getLmsGroupAvailability, getSeatsLeft } from '@/lib/lms-availability';
import { Plus, Trash2, Loader2, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { getFriendlyError } from '@/lib/error-messages';

const emptyForm = {
  contactId: '',
  amount: '',
  currency: 'KGS',
  pipelineStage: 'new' as DealPipelineStage,
  notes: '',
  initialTaskTitle: '',
  initialTaskDescription: '',
  initialTaskDueAt: '',
};

export default function DealsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { canViewLmsTechnicalFields } = useRolePermissions();
  const { isLmsBridgeEnabled } = useLmsBridge();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingDealId, setUpdatingDealId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const prefillCourseId = searchParams.get('courseId') || '';
  const prefillGroupId = searchParams.get('groupId') || '';
  const shouldOpenCreate = searchParams.get('create') === '1';

  const clearPrefillParams = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('create');
      next.delete('courseId');
      next.delete('courseType');
      next.delete('groupId');
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
    dealsApi.list({ search })
      .then((res) => {
        setDeals(res.items);
        setTotalItems(res.total || 0);
      })
      .catch(() => {
        setDeals([]);
        setTotalItems(0);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchDeals(); }, [search]);

  useEffect(() => {
    if (!showCreate) return;
    setContactsLoading(true);
    contactApi.list({ page: 1, limit: 100 })
      .then((res) => setContacts(res.items))
      .catch(() => setContacts([]))
      .finally(() => setContactsLoading(false));
  }, [showCreate]);

  useEffect(() => {
    if (!shouldOpenCreate) return;
    setShowCreate(true);
  }, [shouldOpenCreate]);

  const handleContactChange = (value: string) => {
    setForm((prev) => ({ ...prev, contactId: value }));
  };

  const handleCreate = async () => {
    if (!form.contactId || !form.amount || !form.initialTaskTitle.trim()) return;
    setIsCreating(true);
    try {
      const deal = await dealsApi.create({
        leadId: Number(form.contactId),
        contactId: Number(form.contactId),
        amount: Number(form.amount),
        currency: form.currency,
        pipelineStage: form.pipelineStage,
        notes: form.notes || undefined,
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
        stage: mapPipelineToDealStage(pipelineStage),
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
    const stage = getDealPipelineStage(deal);

    switch (stage) {
      case 'new':
        return [
          { value: 'consultation', label: 'Консультация' },
          { value: 'lost', label: 'Жоголду' },
        ];
      case 'consultation':
        return [
          { value: 'trial', label: 'Сыноого өткөрүү' },
          { value: 'negotiation', label: 'Сунушка өтүү' },
        ];
      case 'trial':
        return [
          { value: 'negotiation', label: 'Сүйлөшүүгө өтүү' },
          { value: 'lost', label: 'Жоголду' },
        ];
      case 'negotiation':
        return [
          { value: 'payment_pending', label: 'Төлөм күтүү' },
          { value: 'won', label: 'Жабылды' },
        ];
      case 'payment_pending':
        return [
          { value: 'won', label: 'Төлөндү' },
          { value: 'negotiation', label: 'Кайра сүйлөшүү' },
        ];
      case 'lost':
        return [
          { value: 'consultation', label: 'Кайра ачуу' },
        ];
      default:
        return [];
    }
  };

  const columns: Column<Deal>[] = [
    { key: 'contact', header: 'Студент', render: (d) => <span className="font-medium">{d.contact?.fullName || '—'}</span> },
    { key: 'amount', header: ky.deals.amount, render: (d) => <span className="font-medium">{d.amount.toLocaleString()} {d.currency || 'сом'}</span> },
    { key: 'stage', header: ky.deals.stage, render: (d) => { const stage = getDealPipelineStage(d); return <StatusBadge variant={getLeadStatusVariant(stage)} dot>{ky.dealPipelineStage[stage]}</StatusBadge>; } },
    {
      key: 'actions', header: '', render: (d) => (
        <div className="flex items-center justify-end gap-1">
          <Select
            value={getDealPipelineStage(d)}
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
              {Object.entries(ky.dealPipelineStage).map(([value, label]) => (
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
  const mobileBoardColumns = Object.entries(ky.dealPipelineStage).map(([value, label]) => ({ id: value, title: label }));
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
          {deals.filter((deal) => getDealPipelineStage(deal) === 'payment_pending').length} төлөм күтөт
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1">
          {deals.filter((deal) => getDealPipelineStage(deal) === 'won').length} ийгиликтүү
        </span>
      </div>
    </div>
  );

  const renderMobileCard = (deal: Deal) => {
    const stage = getDealPipelineStage(deal);
    const quickActions = getDealQuickActions(deal);

    return (
      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{deal.contact?.fullName || '—'}</p>
          </div>
          <StatusBadge variant={getLeadStatusVariant(stage)} dot>
            {ky.dealPipelineStage[stage]}
          </StatusBadge>
        </div>

        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{deal.amount.toLocaleString()} {deal.currency || 'сом'}</p>
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
            {canViewLmsTechnicalFields() && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/enrollments?crmDealId=${deal.id}${deal.contact?.lmsStudentId ? `&studentId=${encodeURIComponent(deal.contact.lmsStudentId)}` : ''}`);
                }}
                aria-label="LMS"
              >
                <GraduationCap className="h-4 w-4" />
              </Button>
            )}
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
        getMobileBoardColumnId={(deal) => getDealPipelineStage(deal)}
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
