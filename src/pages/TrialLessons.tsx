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
import type { Contact, Deal, TrialLesson } from '@/types';
import { contactApi, dealsApi, trialLessonsApi } from '@/api/modules';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';

const trialResultVariant = (s: string) => {
  switch (s) { case 'pending': return 'info' as const; case 'attended': case 'passed': return 'success' as const; case 'failed': return 'destructive' as const; case 'missed': return 'warning' as const; default: return 'default' as const; }
};

const emptyForm = { contactId: '', dealId: '', scheduledAt: '', notes: '' };

export default function TrialLessonsPage() {
  const { toast } = useToast();
  const [trials, setTrials] = useState<TrialLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<TrialLesson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const resetCreateForm = () => {
    setForm(emptyForm);
    setShowCreate(false);
  };

  const fetchTrials = () => {
    setIsLoading(true);
    trialLessonsApi.list({ search })
      .then((res) => {
        setTrials(res.items);
        setTotalItems(res.total || 0);
      })
      .catch(() => {
        setTrials([]);
        setTotalItems(0);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchTrials(); }, [search]);

  useEffect(() => {
    if (!showCreate) return;
    setOptionsLoading(true);
    Promise.all([
      contactApi.list({ page: 1, limit: 100 }),
      dealsApi.list({ page: 1, limit: 100 }),
    ])
      .then(([contactsRes, dealsRes]) => {
        setContacts(contactsRes.items);
        setDeals(dealsRes.items);
      })
      .catch(() => {
        setContacts([]);
        setDeals([]);
      })
      .finally(() => setOptionsLoading(false));
  }, [showCreate]);

  useEffect(() => {
    if (!form.dealId) return;
    const selectedDeal = deals.find((deal) => String(deal.id) === form.dealId);
    if (!selectedDeal?.contactId) return;

    setForm((prev) => (
      prev.contactId === String(selectedDeal.contactId)
        ? prev
        : { ...prev, contactId: String(selectedDeal.contactId) }
    ));
  }, [deals, form.dealId]);

  const handleCreate = async () => {
    if (!form.contactId || !form.scheduledAt) return;
    setIsCreating(true);
    try {
      await trialLessonsApi.create({
        contactId: Number(form.contactId),
        dealId: form.dealId ? Number(form.dealId) : undefined,
        scheduledAt: form.scheduledAt,
        notes: form.notes || undefined,
      });
      toast({ title: 'Сыноо сабак ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      fetchTrials();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Сыноо сабакты сактоо ишке ашкан жок' });
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

      {trial.notes && (
        <p className="mt-3 rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
          {trial.notes}
        </p>
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
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Сыноо сабак издөө..."
        activeFilters={activeFilters}
        totalItems={totalItems}
        totalItemsLabel="сыноо сабак"
        stickyHeader
        renderMobileCard={renderMobileCard}
        mobileBoardColumns={mobileBoardColumns}
        getMobileBoardColumnId={(trial) => trial.result}
        mobileBoardEmptyMessage="Бул тилкеде сыноо сабак жок"
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
                      #{deal.id} • {deal.courseNameSnapshot || 'Курс көрсөтүлгөн эмес'}
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
              <Label>{ky.common.notes}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Эскертүүлөр..." />
            </div>
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
