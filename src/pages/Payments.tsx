import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge, getPaymentStatusVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ky } from '@/lib/i18n';
import type { Payment } from '@/types';
import { paymentsApi } from '@/api/modules';
import { Plus, CheckCircle, Loader2 } from 'lucide-react';

const mockPayments: Payment[] = [
  { id: 1, amount: 15000, method: 'card', paidAt: '2024-03-10', status: 'confirmed', user: { id: 1, fullName: 'Элнура Турдалиева' } },
  { id: 2, amount: 10000, method: 'manual', paidAt: '2024-03-08', status: 'submitted', user: { id: 2, fullName: 'Данияр Абдыраев' } },
  { id: 3, amount: 16000, method: 'bank', paidAt: '2024-03-09', status: 'overdue', user: { id: 3, fullName: 'Жаныл Бекова' } },
];

const emptyForm = { amount: '', method: 'card' as string };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<Payment | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const fetchPayments = () => {
    setIsLoading(true);
    paymentsApi.list({ search })
      .then((res) => setPayments(res.items))
      .catch(() => setPayments(mockPayments))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [search]);

  const handleCreate = async () => {
    if (!form.amount) return;
    setIsCreating(true);
    try {
      await paymentsApi.create({ amount: Number(form.amount), method: form.method as Payment['method'] });
      toast({ title: 'Төлөм ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      fetchPayments();
    } catch {
      toast({ title: 'Төлөм кошууда ката кетти', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setIsConfirming(true);
    try {
      await paymentsApi.update(confirmTarget.id, { status: 'confirmed' });
      toast({ title: 'Төлөм ырасталды' });
      setConfirmTarget(null);
      fetchPayments();
    } catch {
      toast({ title: 'Ырастоо ишке ашкан жок', variant: 'destructive' });
    } finally {
      setIsConfirming(false);
    }
  };

  const columns: Column<Payment>[] = [
    { key: 'user', header: 'Студент', render: (p) => <span className="font-medium">{p.user?.fullName || '—'}</span> },
    { key: 'amount', header: ky.payments.amount, render: (p) => <span className="font-semibold">{p.amount.toLocaleString()} сом</span> },
    { key: 'method', header: ky.payments.method, render: (p) => ky.paymentMethod[p.method] },
    { key: 'paidAt', header: ky.payments.paidAt, render: (p) => p.paidAt ? new Date(p.paidAt).toLocaleDateString('ky-KG') : '—' },
    { key: 'status', header: ky.common.status, render: (p) => (
      <div className="flex items-center gap-2">
        <StatusBadge variant={getPaymentStatusVariant(p.status)} dot>{ky.paymentStatus[p.status]}</StatusBadge>
        {p.status === 'submitted' && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-success hover:text-success" title={ky.payments.confirmPayment} onClick={() => setConfirmTarget(p)}>
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.payments.title} actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.payments.submitPayment}</Button>} />
      <DataTable columns={columns} data={payments} isLoading={isLoading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Төлөм издөө..." />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>{ky.payments.newPayment}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{ky.payments.amount} *</Label>
              <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="15000" type="number" />
            </div>
            <div className="space-y-2">
              <Label>{ky.payments.method}</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ky.paymentMethod).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || !form.amount}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Төлөмдү ырастоо</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.user?.fullName} — {confirmTarget?.amount.toLocaleString()} сом төлөмүн ырастайсызбы?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>{ky.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ырастоо
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
