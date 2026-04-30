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
import { formatDate } from '@/lib/formatting';
import type { Deal, Payment } from '@/types';
import type { DealWithCourseMapping } from '@/types/bridge';
import { dealsApi, paymentsApi, bridgeApi } from '@/api/modules';
import { Plus, CheckCircle, Loader2 } from 'lucide-react';
import { getFriendlyError } from '@/lib/error-messages';
import { useAuth } from '@/contexts/AuthContext';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useTenantConfig } from '@/components/core/TenantConfigProvider';
import { useLmsBridge } from '@/components/lms/LmsBridgeProvider';

const emptyForm = { dealId: '', amount: '', kind: 'regular' as Payment['kind'], method: '' as string };

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canViewLmsTechnicalFields } = useRolePermissions();
  const { tenantConfig } = useTenantConfig();
  const { isLmsBridgeEnabled } = useLmsBridge();
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all');
  const [confirmTarget, setConfirmTarget] = useState<Payment | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealBridgeData, setDealBridgeData] = useState<DealWithCourseMapping | null>(null);
  const { toast } = useToast();
  const prefillDealId = searchParams.get('dealId') || '';
  const shouldOpenCreate = searchParams.get('create') === '1';
  const selectedDeal = deals.find((deal) => String(deal.id) === form.dealId);
  const selectedDealPayments = payments.filter((payment) => String(payment.dealId) === form.dealId);
  const selectedDealSummary = selectedDealPayments[0]?.dealPaymentSummary ?? null;
  const canConfirmPayments = user?.role !== 'sales';

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
        if (Array.isArray(res)) {
          setPayments(res ?? []);
          setTotalItems(res?.length || 0);
          return;
        }

        setPayments(res.items ?? []);
        setTotalItems(res.total || 0);
      })
      .catch((error: unknown) => {
        const friendly = getFriendlyError(error, { fallbackTitle: 'Төлөмдөрдү жүктөө ишке ашкан жок' });
        setPayments([]);
        setTotalItems(0);
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

  useEffect(() => {
    if (!selectedDeal || !isLmsBridgeEnabled) {
      setDealBridgeData(null);
      return;
    }
    bridgeApi.getDealBridgeData(selectedDeal.id)
      .then((data) => setDealBridgeData(data))
      .catch(() => setDealBridgeData(null));
  }, [selectedDeal, isLmsBridgeEnabled]);

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
    const dealId = payment.deal?.id;

    if (!dealId) return '—';

    return `#${dealId}`;
  };

  const getPaymentMethodName = (methodKey: string) => {
    const pm = tenantConfig.paymentMethods.find(p => p.methodKey === methodKey);
    if (pm) return pm.methodName;
    return ky.paymentMethod[methodKey] || methodKey;
  };

  const columns: Column<Payment>[] = [
    { key: 'user', header: 'Студент', render: (p) => <span className="font-medium">{getPaymentStudentName(p)}</span> },
    { key: 'deal', header: 'Келишим', render: (p) => <span className="text-sm">{getPaymentDealLabel(p)}</span> },
    { key: 'kind', header: ky.payments.kind, render: (p) => ky.paymentKind[p.kind || 'regular'] },
    { key: 'amount', header: ky.payments.amount, render: (p) => <span className="font-semibold">{p.amount.toLocaleString()} {tenantConfig.currency}</span> },
    { key: 'method', header: ky.payments.method, render: (p) => getPaymentMethodName(p.method) },
    { key: 'paidAt', header: ky.payments.paidAt, render: (p) => p.paidAt ? formatDate(p.paidAt) : '—' },
    {
      key: 'status', header: ky.common.status, render: (p) => (
        <div className="flex items-center gap-2">
          <StatusBadge variant={getPaymentStatusVariant(getPaymentWorkflowStatus(p))} dot>{ky.paymentStatus[getPaymentWorkflowStatus(p)]}</StatusBadge>
          {canConfirmPayments && getPaymentWorkflowStatus(p) === 'submitted' && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-success hover:text-success" title={ky.payments.confirmPayment} aria-label={`${getPaymentStudentName(p)} үчүн ${ky.payments.confirmPayment.toLowerCase()}`} onClick={() => setConfirmTarget(p)}>
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )
    },
  ];
  const mobileBoardColumns = Object.entries(ky.paymentStatus)
    .filter(([value]) => statusFilter === 'all' || value === statusFilter)
    .map(([value, label]) => ({ id: value, title: label }));
  const activeFilters = [
    ...(search.trim()
      ? [{
        key: 'search',
        label: `Издөө: ${search.trim()}`,
        onRemove: () => setSearch(''),
      }]
      : []),
    ...(statusFilter !== 'all'
      ? [{
        key: 'status',
        label: `Статус: ${ky.paymentStatus[statusFilter]}`,
        onRemove: () => setStatusFilter('all'),
      }]
      : []),
  ];
  const headerActions = (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус</p>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | Payment['status'])}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Статус тандаңыз" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бардык статус</SelectItem>
            {Object.entries(ky.paymentStatus).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="hidden items-center gap-2 text-xs text-muted-foreground xl:flex">
        <span className="rounded-full bg-secondary px-2.5 py-1">{totalItems} төлөм</span>
        <span className="rounded-full bg-secondary px-2.5 py-1">
          {payments.filter((payment) => getPaymentWorkflowStatus(payment) === 'submitted').length} күтүлүүдө
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1">
          {payments.filter((payment) => getPaymentWorkflowStatus(payment) === 'confirmed').length} ырасталды
        </span>
      </div>
    </div>
  );

  const renderMobileCard = (payment: Payment) => {
    const workflowStatus = getPaymentWorkflowStatus(payment);

    return (
      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{getPaymentStudentName(payment)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{getPaymentDealLabel(payment)}</p>
          </div>
          <StatusBadge variant={getPaymentStatusVariant(workflowStatus)} dot>
            {ky.paymentStatus[workflowStatus]}
          </StatusBadge>
        </div>

        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{payment.amount.toLocaleString()} {tenantConfig.currency}</p>
          <p>{ky.paymentKind[payment.kind || 'regular']} • {getPaymentMethodName(payment.method)}</p>
          <p>{payment.paidAt ? formatDate(payment.paidAt) : 'Дата жок'}</p>
        </div>

        {canConfirmPayments && workflowStatus === 'submitted' && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmTarget(payment);
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {ky.payments.confirmPayment}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title={ky.payments.title} description="Төлөмдөрдү көзөмөлдөп, ырастоону күткөндөрдү тез иштетиңиз." actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.payments.submitPayment}</Button>} />
      <DataTable
        columns={columns}
        data={payments}
        isLoading={isLoading}
        errorMessage={loadError || undefined}
        onRetry={fetchPayments}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Төлөм издөө..."
        headerActions={headerActions}
        emptyMessage={ky.common.noData}
        activeFilters={activeFilters}
        totalItems={totalItems}
        totalItemsLabel="төлөм"
        stickyHeader
        renderMobileCard={renderMobileCard}
        mobileBoardColumns={mobileBoardColumns}
        getMobileBoardColumnId={(payment) => getPaymentWorkflowStatus(payment)}
        mobileBoardEmptyMessage="Бул тилкеде төлөм жок"
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
                      #{deal.id} • {deal.contact?.fullName || `Байланыш #${deal.contactId ?? '—'}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDeal && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
                  <p>
                    {dealBridgeData?.courseNameSnapshot || 'Курс көрсөтүлгөн эмес'}
                    {selectedDeal.contact?.fullName ? ` • ${selectedDeal.contact.fullName}` : ''}
                  </p>
                  {selectedDealSummary ? (
                    <p>
                      Жалпы: {selectedDealSummary.dealTotal.toLocaleString()} {tenantConfig.currency}
                      {' • '}Ырасталды: {selectedDealSummary.confirmedPaid.toLocaleString()} {tenantConfig.currency}
                      {' • '}Депозит: {selectedDealSummary.depositPaid.toLocaleString()} {tenantConfig.currency}
                      {' • '}Калганы: {selectedDealSummary.remaining.toLocaleString()} {tenantConfig.currency}
                    </p>
                  ) : selectedDeal.amount != null ? (
                    <p>Жалпы: {Number(selectedDeal.amount).toLocaleString()} {tenantConfig.currency}</p>
                  ) : null}
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
                  {tenantConfig.paymentMethods.map((pm) => (
                    <SelectItem key={pm.methodKey} value={pm.methodKey}>
                      {pm.methodName || ky.paymentMethod[pm.methodKey] || pm.methodKey}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetCreateForm}>{ky.common.cancel}</Button>
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
              {`${confirmTarget ? getPaymentStudentName(confirmTarget) : 'Кардар'} — ${confirmTarget?.amount?.toLocaleString?.() ?? '0'} сом төлөмүн ырастайсызбы?`}
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
