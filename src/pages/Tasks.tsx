import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge, getTaskStatusVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ky } from '@/lib/i18n';
import type { Contact, Deal, Task, TaskWorkflowStatus } from '@/types';
import { getTaskWorkflowStatus } from '@/lib/crm-status';
import { contactApi, dealsApi, tasksApi } from '@/api/modules';
import { Plus, Filter, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mockTasks: Task[] = [
  { id: 1, title: 'Азаматка чалуу', description: 'Python курсу жөнүндө', status: 'open', dueAt: '2024-03-11', assignedTo: { id: 1, fullName: 'Нургуль' }, createdAt: '2024-03-09' },
  { id: 2, title: 'Сыноо сабакты ырастоо', description: 'Бакытка чалуу', status: 'in_progress', dueAt: '2024-03-10', assignedTo: { id: 2, fullName: 'Айбек' }, createdAt: '2024-03-08' },
  { id: 3, title: 'Сунуш жиберүү', description: 'Гүлнарага сунуш', status: 'open', dueAt: '2024-03-12', assignedTo: { id: 3, fullName: 'Эрлан' }, createdAt: '2024-03-09' },
];

const emptyForm = { title: '', description: '', dueAt: '', contactId: '', dealId: '' };

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingTaskId, setIsUpdatingTaskId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const fetchTasks = () => {
    setIsLoading(true);
    tasksApi.list({ search, workflowStatus: statusFilter === 'all' ? undefined : statusFilter })
      .then((res) => setTasks(res.items))
      .catch(() => setTasks(mockTasks))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchTasks(); }, [search, statusFilter]);

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
    if (!form.title) return;
    setIsCreating(true);
    try {
      await tasksApi.create({
        title: form.title,
        description: form.description || undefined,
        dueAt: form.dueAt || undefined,
        contactId: form.contactId ? Number(form.contactId) : undefined,
        dealId: form.dealId ? Number(form.dealId) : undefined,
      });
      toast({ title: 'Тапшырма ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      fetchTasks();
    } catch {
      toast({ title: 'Тапшырма кошууда ката кетти', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await tasksApi.delete(deleteTarget.id);
      toast({ title: ky.tasks.deleteSuccess });
      setDeleteTarget(null);
      fetchTasks();
    } catch {
      toast({ title: ky.tasks.deleteError, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkDone = async (task: Task) => {
    setIsUpdatingTaskId(task.id);
    try {
      await tasksApi.update(task.id, { workflowStatus: 'completed' });
      toast({ title: 'Тапшырма аткарылды' });
      fetchTasks();
    } catch {
      toast({ title: 'Тапшырманы жаңыртууда ката кетти', variant: 'destructive' });
    } finally {
      setIsUpdatingTaskId(null);
    }
  };

  const filtered = tasks.filter((t) => statusFilter === 'all' || getTaskWorkflowStatus(t) === statusFilter);

  const columns: Column<Task>[] = [
    { key: 'title', header: 'Тапшырма', render: (t) => (
      <div>
        <span className="font-medium">{t.title}</span>
        {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
      </div>
    )},
    { key: 'assignedTo', header: ky.tasks.assignedUser, render: (t) => t.assignedTo?.fullName || '—' },
    { key: 'relatedTo', header: ky.tasks.relatedTo, render: (t) => `Байланыш: ${t.contactId || '—'} / Келишим: ${t.dealId || '—'}`, className: 'hidden lg:table-cell' },
    { key: 'dueAt', header: ky.tasks.dueAt, render: (t) => t.dueAt ? new Date(t.dueAt).toLocaleDateString('ky-KG') : '—' },
    { key: 'status', header: ky.common.status, render: (t) => (
      <div className="flex items-center gap-2">
        {(() => { const status = getTaskWorkflowStatus(t); return <StatusBadge variant={getTaskStatusVariant(status)} dot>{ky.taskWorkflowStatus[status]}</StatusBadge>; })()}
        {getTaskWorkflowStatus(t) !== 'completed' && getTaskWorkflowStatus(t) !== 'cancelled' && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-success hover:text-success" onClick={() => handleMarkDone(t)} disabled={isUpdatingTaskId === t.id}>
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )},
    {
      key: 'actions', header: '', render: (t) => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(t); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const renderMobileCard = (task: Task) => (
    <Card className="shadow-card border-border/50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{task.title}</p>
            {task.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>}
          </div>
          {(() => { const status = getTaskWorkflowStatus(task); return <StatusBadge variant={getTaskStatusVariant(status)} dot>{ky.taskWorkflowStatus[status]}</StatusBadge>; })()}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-muted/60 p-2">
            <p className="text-xs text-muted-foreground">{ky.tasks.assignedUser}</p>
            <p className="truncate font-medium">{task.assignedTo?.fullName || '—'}</p>
          </div>
          <div className="rounded-md bg-muted/60 p-2">
            <p className="text-xs text-muted-foreground">{ky.tasks.dueAt}</p>
            <p className="font-medium">{task.dueAt ? new Date(task.dueAt).toLocaleDateString('ky-KG') : '—'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {getTaskWorkflowStatus(task) !== 'completed' && getTaskWorkflowStatus(task) !== 'cancelled' ? (
            <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Белгилөө
            </Button>
          ) : <span />}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(task); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.tasks.title} actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.tasks.newTask}</Button>} />
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ky.common.all}</SelectItem>
            {Object.entries(ky.taskWorkflowStatus).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Тапшырма издөө..." renderMobileCard={renderMobileCard} />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{ky.tasks.newTask}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Тапшырма аталышы *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Тапшырма аталышы" />
            </div>
            <div className="space-y-2">
              <Label>{ky.tasks.description}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Сүрөттөмө..." />
            </div>
            <div className="space-y-2">
              <Label>{ky.tasks.dueAt}</Label>
              <Input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Байланыш</Label>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || !form.title}>
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
            <AlertDialogTitle>{ky.tasks.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{ky.tasks.deleteConfirmDesc}</AlertDialogDescription>
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
