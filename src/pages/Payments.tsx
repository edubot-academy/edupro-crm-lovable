import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { getFriendlyError } from '@/lib/error-messages';
import { useAuth } from '@/contexts/AuthContext';

const emptyForm = { dealId: '', amount: '', kind: 'regular' as Payment['kind'], method: 'card' as string };

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const prefillDealId = searchParams.get('dealId') || '';
  const shouldOpenCreate = searchParams.get('create') === '1';
  const selectedDeal = deals.find((deal) => String(deal.id) === form.dealId);
  const selectedDealPayments = payments.filter((payment) => String(payment.dealId) === form.dealId);
  const selectedDealSummary = selectedDealPayments[0]?.dealPaymentSummary ?? null;
  const canConfirmPayments = user?.role !== 'sales';

  const dealRequiresLmsEmail = (deal?: Deal | Payment['deal']) =>
    !!deal?.lmsCourseId && !!deal?.courseType;

  const dealMissingLmsGroup = (deal?: Deal | Payment['deal']) =>
    !!deal?.lmsCourseId &&
    !!deal?.courseType &&
    deal.courseType !== 'video' &&
    !deal?.lmsGroupId;

  const selectedDealMissingEnrollmentEmail =
    dealRequiresLmsEmail(selectedDeal) && !selectedDeal?.contact?.email?.trim();

  const confirmTargetMissingEnrollmentEmail =
    dealRequiresLmsEmail(confirmTarget?.deal) &&
    !confirmTarget?.lmsEnrollmentId &&
    !confirmTarget?.deal?.contact?.email?.trim();

  const confirmTargetMissingEnrollmentGroup =
    dealMissingLmsGroup(confirmTarget?.deal) &&
    !confirmTarget?.lmsEnrollmentId;

  const clearPrefillParams = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('dealId');
      next.delete('create');
      return next;
    }, { replace: true });
  };

  const resetCreateForm = () => {
    setForm(emptyForm);
    clearPrefillParams();
    setShowCreate(false);
  };

  const fetchPayments = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    paymentsApi.list({ search: search || undefined, paymentStatus: statusFilter === 'all' ? undefined : statusFilter })
      .then((res) => {
        const items = Array.isArray(res) ? res : res.items;
        setPayments(items ?? []);
      })
      .catch((error: unknown) => {
        const friendly = getFriendlyError(error, { fallbackTitle: 'Төлөмдөрдү жүктөө ишке ашкан жок' });
        setPayments([]);
        setLoadError(friendly.description || friendly.title);
      })
      .finally(() => setIsLoading(false));
  }, [search, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (!shouldOpenCreate) return;
    setShowCreate(true);
  }, [shouldOpenCreate]);

  useEffect(() => {
    if (!showCreate) return;
    setDealsLoading(true);
    dealsApi.list({ page: 1, limit: 100 })
      .then((res) => setDeals(res.items))
      .catch(() => setDeals([]))
      .finally(() => setDealsLoading(false));
  }, [showCreate]);

  useEffect(() => {
    if (!showCreate || !prefillDealId) return;
    setForm((prev) => ({ ...prev, dealId: prefillDealId }));
  }, [showCreate, prefillDealId]);

  const handleCreate = async () => {
    if (!form.dealId || !form.amount) return;
    if (selectedDealMissingEnrollmentEmail) {
      toast({
        title: 'LMS каттоо үчүн email керек',
        description: 'Бул келишим LMS каттоону түзөт. Адегенде байланыштын email дарегин толтуруңуз.',
        variant: 'destructive',
      });
      return;
    }
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
      clearPrefillParams();
      fetchPayments();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Төлөмдү сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    if (confirmTargetMissingEnrollmentEmail) {
      toast({
        title: 'LMS каттоо үчүн email керек',
        description: 'Бул төлөмдү ырастоодон мурун байланыштын email дарегин толтуруңуз.',
        variant: 'destructive',
      });
      return;
    }
    if (confirmTargetMissingEnrollmentGroup) {
      toast({
        title: 'LMS тобу келишимде көрсөтүлгөн эмес',
        description: 'Бул төлөм оффлайн же онлайн түз эфир курсу үчүн. Алгач deal ичиндеги LMS тобун толтуруңуз.',
        variant: 'destructive',
      });
      return;
    }
    setIsConfirming(true);
    try {
      await paymentsApi.update(confirmTarget.id, { paymentStatus: 'confirmed' });
      toast({ title: 'Төлөм ырасталды' });
      setConfirmTarget(null);
      fetchPayments();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Төлөмдү ырастоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsConfirming(false);
    }
  };

  const getPaymentStudentName = (payment: Payment) =>
    payment.deal?.contact?.fullName || payment.contact?.fullName || payment.user?.fullName || '—';

  const getPaymentDealLabel = (payment: Payment) => {
    const dealId = payment.deal?.id || payment.dealId;
    const course = payment.deal?.courseNameSnapshot;
    const group = payment.deal?.groupNameSnapshot;

    if (!dealId && !course && !group) return '—';

    const details = [course, group].filter(Boolean).join(' • ');
    return details ? `#${dealId ?? '—'} • ${details}` : `#${dealId ?? '—'}`;
  };

  const columns: Column<Payment>[] = [
    { key: 'user', header: 'Студент', render: (p) => <span className="font-medium">{getPaymentStudentName(p)}</span> },
    { key: 'deal', header: 'Келишим', render: (p) => <span className="text-sm">{getPaymentDealLabel(p)}</span> },
    { key: 'kind', header: ky.payments.kind, render: (p) => ky.paymentKind[p.kind || 'regular'] },
    { key: 'amount', header: ky.payments.amount, render: (p) => <span className="font-semibold">{p.amount.toLocaleString()} сом</span> },
    { key: 'method', header: ky.payments.method, render: (p) => ky.paymentMethod[p.method] },
    { key: 'paidAt', header: ky.payments.paidAt, render: (p) => p.paidAt ? new Date(p.paidAt).toLocaleDateString('ky-KG') : '—' },
    { key: 'status', header: ky.common.status, render: (p) => (
      <div className="flex items-center gap-2">
        <StatusBadge variant={getPaymentStatusVariant(getPaymentWorkflowStatus(p))} dot>{ky.paymentStatus[getPaymentWorkflowStatus(p)]}</StatusBadge>
        {canConfirmPayments && getPaymentWorkflowStatus(p) === 'submitted' && (
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
      <DataTable
        columns={columns}
        data={payments}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Төлөм издөө..."
        emptyMessage={loadError || ky.common.noData}
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
              {selectedDeal && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
                  <p>
                    {selectedDeal.courseNameSnapshot || 'Курс көрсөтүлгөн эмес'}
                    {selectedDeal.contact?.fullName ? ` • ${selectedDeal.contact.fullName}` : ''}
                  </p>
                  {selectedDealSummary ? (
                    <p>
                      Жалпы: {selectedDealSummary.dealTotal.toLocaleString()} сом
                      {' • '}Ырасталды: {selectedDealSummary.confirmedPaid.toLocaleString()} сом
                      {' • '}Депозит: {selectedDealSummary.depositPaid.toLocaleString()} сом
                      {' • '}Калганы: {selectedDealSummary.remaining.toLocaleString()} сом
                    </p>
                  ) : selectedDeal.amount != null ? (
                    <p>Жалпы: {Number(selectedDeal.amount).toLocaleString()} сом</p>
                  ) : null}
                </div>
              )}
              {selectedDealMissingEnrollmentEmail && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive space-y-2">
                  <p>
                    Бул келишим LMS каттоону түзөт. Улантуу үчүн байланыштын email дарегин толтуруңуз.
                  </p>
                  {selectedDeal?.contact?.id && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/contacts/${selectedDeal.contact?.id}`)}
                    >
                      Байланышты ачуу
                    </Button>
                  )}
                </div>
              )}
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
            <Button variant="outline" onClick={resetCreateForm}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || !form.dealId || !form.amount || selectedDealMissingEnrollmentEmail}>
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
              {confirmTargetMissingEnrollmentEmail
                ? 'Бул төлөм LMS каттоону активдештирет. Адегенде байланыштын email дарегин толтуруңуз.'
                : confirmTargetMissingEnrollmentGroup
                  ? 'Бул төлөм LMS каттоону активдештирет. Оффлайн жана онлайн түз эфир курстары үчүн deal ичинде LMS тобу милдеттүү.'
                : `${confirmTarget ? getPaymentStudentName(confirmTarget) : 'Кардар'} — ${confirmTarget?.amount?.toLocaleString?.() ?? '0'} сом төлөмүн ырастайсызбы?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>{ky.common.cancel}</AlertDialogCancel>
            {confirmTargetMissingEnrollmentEmail && confirmTarget?.deal?.contact?.id ? (
              <AlertDialogAction onClick={() => navigate(`/contacts/${confirmTarget.deal?.contact?.id}`)} disabled={isConfirming}>
                Байланышты ачуу
              </AlertDialogAction>
            ) : confirmTargetMissingEnrollmentGroup && confirmTarget?.deal?.id ? (
              <AlertDialogAction onClick={() => navigate(`/deals/${confirmTarget.deal?.id}`)} disabled={isConfirming}>
                Келишимди ачуу
              </AlertDialogAction>
            ) : (
            <AlertDialogAction onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ырастоо
            </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
