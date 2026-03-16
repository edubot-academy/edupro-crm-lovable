import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ky } from '@/lib/i18n';
import { dealsApi } from '@/api/modules';
import type { Deal } from '@/types';
import { Plus, Trash2, Loader2, User, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mockDeals: Deal[] = [
  { id: 1, leadId: 1, lead: { id: 1, fullName: 'Элнура Турдалиева' }, lmsCourseId: 'c1', courseNameSnapshot: 'Python', lmsGroupId: 'g1', groupNameSnapshot: 'PY-24-1', amount: 15000, currency: 'KGS', stage: 'won', createdAt: '2024-02-20', updatedAt: '2024-03-10' },
  { id: 2, leadId: 2, lead: { id: 2, fullName: 'Данияр Абдыраев' }, lmsCourseId: 'c2', courseNameSnapshot: 'Data Science', lmsGroupId: 'g2', groupNameSnapshot: 'DS-24-1', amount: 20000, currency: 'KGS', stage: 'payment_pending', createdAt: '2024-03-01', updatedAt: '2024-03-08' },
];

const emptyForm = { leadId: '', amount: '', currency: 'KGS', stage: 'new_lead' as string, courseNameSnapshot: '' };

export default function DealsPage() {
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchDeals = () => {
    setIsLoading(true);
    dealsApi.list({ search })
      .then((res) => setDeals(res.items))
      .catch(() => setDeals(mockDeals))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchDeals(); }, [search]);

  const handleCreate = async () => {
    if (!form.leadId || !form.amount) return;
    setIsCreating(true);
    try {
      await dealsApi.create({ leadId: Number(form.leadId), amount: Number(form.amount), currency: form.currency, stage: form.stage as Deal['stage'], courseNameSnapshot: form.courseNameSnapshot || undefined });
      toast({ title: 'Келишим ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      fetchDeals();
    } catch {
      toast({ title: 'Келишим кошууда ката кетти', variant: 'destructive' });
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
    } catch {
      toast({ title: ky.deals.deleteError, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Deal>[] = [
    { key: 'lead', header: 'Лид', render: (d) => <span className="font-medium">{d.lead?.fullName || d.contact?.fullName || '—'}</span> },
    { key: 'courseNameSnapshot', header: ky.deals.course, render: (d) => d.courseNameSnapshot || '—' },
    { key: 'groupNameSnapshot', header: ky.deals.group, render: (d) => d.groupNameSnapshot || '—' },
    { key: 'amount', header: ky.deals.amount, render: (d) => <span className="font-medium">{d.amount.toLocaleString()} {d.currency || 'сом'}</span> },
    { key: 'stage', header: ky.deals.stage, render: (d) => <StatusBadge variant={getLeadStatusVariant(d.stage)} dot>{ky.dealStage[d.stage]}</StatusBadge> },
    {
      key: 'actions', header: '', render: (d) => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(d); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const renderMobileCard = (deal: Deal) => (
    <Card className="shadow-card border-border/50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{deal.lead?.fullName || deal.contact?.fullName || '—'}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="truncate">{deal.courseNameSnapshot || '—'}</span>
            </div>
          </div>
          <StatusBadge variant={getLeadStatusVariant(deal.stage)} dot>{ky.dealStage[deal.stage]}</StatusBadge>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-muted/60 p-2">
            <p className="text-xs text-muted-foreground">{ky.deals.group}</p>
            <p className="truncate font-medium">{deal.groupNameSnapshot || '—'}</p>
          </div>
          <div className="rounded-md bg-muted/60 p-2">
            <p className="text-xs text-muted-foreground">{ky.deals.amount}</p>
            <p className="font-medium">{deal.amount.toLocaleString()} {deal.currency || 'сом'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>Lead ID: {deal.leadId || deal.lead?.id || deal.contact?.id || '—'}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(deal); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.deals.title} actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.deals.newDeal}</Button>} />
      <DataTable columns={columns} data={deals} isLoading={isLoading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Келишим издөө..." renderMobileCard={renderMobileCard} />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>{ky.deals.newDeal}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lead ID *</Label>
              <Input value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} placeholder="Лид ID" type="number" />
            </div>
            <div className="space-y-2">
              <Label>{ky.deals.course}</Label>
              <Input value={form.courseNameSnapshot} onChange={(e) => setForm({ ...form, courseNameSnapshot: e.target.value })} placeholder="Курс аталышы" />
            </div>
            <div className="space-y-2">
              <Label>{ky.deals.amount} *</Label>
              <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="15000" type="number" />
            </div>
            <div className="space-y-2">
              <Label>{ky.deals.stage}</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ky.dealStage).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || !form.leadId || !form.amount}>
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
