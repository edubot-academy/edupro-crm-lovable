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
import { getPaymentWorkflowStatus } from '@/lib/crm-status';
import type { Deal, Payment } from '@/types';
import { dealsApi, paymentsApi } from '@/api/modules';
import { Plus, CheckCircle, Loader2 } from 'lucide-react';

const mockPayments: Payment[] = [
  { id: 1, dealId: 11, kind: 'regular', amount: 15000, method: 'card', paidAt: '2024-03-10', status: 'confirmed', user: { id: 1, fullName: 'Элнура Турдалиева' } },
  { id: 2, dealId: 12, kind: 'deposit', amount: 10000, method: 'manual', paidAt: '2024-03-08', status: 'submitted', user: { id: 2, fullName: 'Данияр Абдыраев' } },
  { id: 3, dealId: 13, kind: 'regular', amount: 16000, method: 'bank', paidAt: '2024-03-09', status: 'overdue', user: { id: 3, fullName: 'Жаныл Бекова' } },
];

const emptyForm = { dealId: '', amount: '', kind: 'regular' as Payment['kind'], method: 'card' as string };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all');
  const [confirmTarget, setConfirmTarget] = useState<Payment | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPayments = () => {
    setIsLoading(true);
    paymentsApi.list({ search, paymentStatus: statusFilter === 'all' ? undefined : statusFilter })
      .then((res) => setPayments(res.items))
      .catch(() => setPayments(mockPayments))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [search, statusFilter]);

  useEffect(() => {
    if (!showCreate) return;
    setDealsLoading(true);
    dealsApi.list({ page: 1, limit: 100 })
      .then((res) => setDeals(res.items))
      .catch(() => setDeals([]))
      .finally(() => setDealsLoading(false));
  }, [showCreate]);

  const handleCreate = async () => {
    if (!form.dealId || !form.amount) return;
    setIsCreating(true);
    try {
      const payload = {
        dealId: Number(form.dealId),
        amount: Number(form.amount),
        method: form.method as Payment['method'],
        paymentStatus: 'submitted' as Payment['status'],
      };
      if (form.kind === 'deposit') {
        await paymentsApi.createDeposit(payload);
      } else {
        await paymentsApi.create(payload);
      }
      toast({ title: form.kind === 'deposit' ? 'Депозит ийгиликтүү кошулду' : 'Төлөм ийгиликтүү кошулду' });
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
      await paymentsApi.update(confirmTarget.id, { paymentStatus: 'confirmed' });
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
    { key: 'deal', header: 'Келишим', render: (p) => p.dealId ? `#${p.dealId}` : '—' },
    { key: 'kind', header: ky.payments.kind, render: (p) => ky.paymentKind[p.kind || 'regular'] },
    { key: 'amount', header: ky.payments.amount, render: (p) => <span className="font-semibold">{p.amount.toLocaleString()} сом</span> },
    { key: 'method', header: ky.payments.method, render: (p) => ky.paymentMethod[p.method] },
    { key: 'paidAt', header: ky.payments.paidAt, render: (p) => p.paidAt ? new Date(p.paidAt).toLocaleDateString('ky-KG') : '—' },
    { key: 'status', header: ky.common.status, render: (p) => (
      <div className="flex items-center gap-2">
        <StatusBadge variant={getPaymentStatusVariant(getPaymentWorkflowStatus(p))} dot>{ky.paymentStatus[getPaymentWorkflowStatus(p)]}</StatusBadge>
        {getPaymentWorkflowStatus(p) === 'submitted' && (
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | Payment['status'])}>
            <SelectTrigger>
              <SelectValue placeholder="Статус тандаңыз" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Баары</SelectItem>
              {Object.entries(ky.paymentStatus).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable columns={columns} data={payments} isLoading={isLoading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Төлөм издөө..." />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{ky.payments.newPayment}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Келишим *</Label>
              <Select
                value={form.dealId || '__none__'}
                onValueChange={(value) => setForm((prev) => ({ ...prev, dealId: value === '__none__' ? '' : value }))}
                disabled={dealsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={dealsLoading ? 'Жүктөлүүдө...' : 'Келишим тандаңыз'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Тандалган эмес</SelectItem>
                  {deals.map((deal) => (
                    <SelectItem key={deal.id} value={String(deal.id)}>
                      #{deal.id} • {deal.courseNameSnapshot || 'Курс көрсөтүлгөн эмес'} • {deal.contact?.fullName || `Байланыш #${deal.contactId ?? '—'}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{ky.payments.kind}</Label>
              <Select value={form.kind || 'regular'} onValueChange={(v) => setForm({ ...form, kind: v as Payment['kind'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ky.paymentKind).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
            <Button onClick={handleCreate} disabled={isCreating || !form.dealId || !form.amount}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form.kind === 'deposit' ? ky.payments.depositPayment : ky.common.create}
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
