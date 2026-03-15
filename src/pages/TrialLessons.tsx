import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ky } from '@/lib/i18n';
import type { TrialLesson } from '@/types';
import { trialLessonsApi } from '@/api/modules';
import { Plus, Trash2, Loader2, CalendarDays, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const trialResultVariant = (s: string) => {
  switch (s) { case 'pending': return 'info' as const; case 'attended': case 'passed': return 'success' as const; case 'failed': return 'destructive' as const; case 'missed': return 'warning' as const; default: return 'default' as const; }
};

const mockTrials: TrialLesson[] = [
  { id: 1, contact: { id: 1, fullName: 'Азамат Токтогулов' }, deal: { id: 1 }, scheduledAt: '2024-03-10T14:00', result: 'pending', createdAt: '2024-03-01' },
  { id: 2, contact: { id: 3, fullName: 'Бакыт Жумалиев' }, deal: { id: 3 }, scheduledAt: '2024-03-08T16:00', result: 'attended', notes: 'Абдан жакты, катталгысы келет', createdAt: '2024-03-03' },
  { id: 3, contact: { id: 4, fullName: 'Гүлнара Касымова' }, deal: { id: 4 }, scheduledAt: '2024-03-09T10:00', result: 'missed', createdAt: '2024-03-04' },
];

const emptyForm = { contactId: '', scheduledAt: '', notes: '' };

export default function TrialLessonsPage() {
  const { toast } = useToast();
  const [trials, setTrials] = useState<TrialLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TrialLesson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchTrials = () => {
    setIsLoading(true);
    trialLessonsApi.list({ search })
      .then((res) => setTrials(res.items))
      .catch(() => setTrials(mockTrials))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchTrials(); }, [search]);

  const handleCreate = async () => {
    if (!form.contactId || !form.scheduledAt) return;
    setIsCreating(true);
    try {
      await trialLessonsApi.create({ contactId: Number(form.contactId), scheduledAt: form.scheduledAt, notes: form.notes || undefined });
      toast({ title: 'Сыноо сабак ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      fetchTrials();
    } catch {
      toast({ title: 'Сыноо сабак кошууда ката кетти', variant: 'destructive' });
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
    } catch {
      toast({ title: ky.trialLessons.deleteError, variant: 'destructive' });
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

  const renderMobileCard = (trial: TrialLesson) => (
    <Card className="shadow-card border-border/50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{trial.contact?.fullName || '—'}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{new Date(trial.scheduledAt).toLocaleString('ky-KG', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
          </div>
          <StatusBadge variant={trialResultVariant(trial.result)} dot>{ky.trialResult[trial.result]}</StatusBadge>
        </div>
        {trial.notes && (
          <div className="rounded-md bg-muted/60 p-2 text-sm text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 text-xs"><FileText className="h-3.5 w-3.5" />{ky.common.notes}</div>
            <p className="line-clamp-3">{trial.notes}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Deal ID: {trial.deal?.id || '—'}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(trial); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.trialLessons.title} actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.trialLessons.newTrialLesson}</Button>} />
      <DataTable columns={columns} data={trials} isLoading={isLoading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Сыноо сабак издөө..." renderMobileCard={renderMobileCard} />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>{ky.trialLessons.newTrialLesson}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Студент ID *</Label>
              <Input value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} placeholder="Байланыш ID" type="number" />
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
            <Button variant="outline" onClick={() => setShowCreate(false)}>{ky.common.cancel}</Button>
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
