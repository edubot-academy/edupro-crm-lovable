import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, CreditCard, Workflow, Pencil, Sparkles } from 'lucide-react';
import { contactApi, dealsApi, paymentsApi, bridgeApi } from '@/api/modules';
import type { Contact, Deal, Payment } from '@/types';
import type { ContactWithStudentMapping } from '@/types/bridge';
import { formatDate } from '@/lib/formatting';
import { IntegrationHistoryPanel } from '@/components/lms/IntegrationHistoryPanel';
import { DealCourseMapping } from '@/components/lms/DealCourseMapping';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useFeatureFlags } from '@/components/core/FeatureFlagProvider';
import { useLmsBridge } from '@/components/lms/LmsBridgeProvider';
import { LmsCourseContextFields } from '@/components/lms/LmsCourseContextFields';
import type { LmsCourseType } from '@/types/lms';
import { AiDraftModal } from '@/components/ai/AiDraftModal';
import { AiDraftHandoffCard } from '@/components/ai/AiDraftHandoffCard';

type DealEditLmsFormState = {
  lmsCourseId: string;
  lmsGroupId: string;
  courseType: LmsCourseType | '';
  courseNameSnapshot: string;
  groupNameSnapshot: string;
};

export default function DealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFeatureEnabled } = useFeatureFlags();
  const { canViewIntegrationHistory } = useRolePermissions();
  const { isLmsBridgeEnabled } = useLmsBridge();
  const isAiDraftsEnabled =
    isFeatureEnabled('ai_assist_enabled') && isFeatureEnabled('ai_followup_drafts_enabled');
  const [deal, setDeal] = useState<Deal | null>(null);
  const [contactBridgeData, setContactBridgeData] = useState<ContactWithStudentMapping | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [isAiDraftOpen, setIsAiDraftOpen] = useState(false);
  const [aiDraftMessage, setAiDraftMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<DealEditLmsFormState>({
    lmsCourseId: '',
    lmsGroupId: '',
    courseType: '',
    courseNameSnapshot: '',
    groupNameSnapshot: '',
  });

  const loadDeal = async (dealId: number) => {
    const dealResult = await dealsApi.get(dealId);
    setDeal(dealResult);
    if (dealResult.contactId) {
      try {
        const contactResult = await contactApi.get(dealResult.contactId);
        setContact(contactResult);
      } catch {
        setContact(null);
      }
    } else {
      setContact(null);
    }
    return dealResult;
  };

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    loadDeal(Number(id))
      .catch(() => setError('Келишим табылган жок'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!contact || !isLmsBridgeEnabled) {
      setContactBridgeData(null);
      return;
    }
    bridgeApi.getContactBridgeData(contact.id)
      .then((data) => setContactBridgeData(data))
      .catch(() => setContactBridgeData(null));
  }, [contact, isLmsBridgeEnabled]);

  useEffect(() => {
    if (!id) return;
    setPaymentsLoading(true);
    paymentsApi.list({ dealId: id, limit: 100 })
      .then((res) => setPayments(res.items))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!deal || !editOpen) return;
    setEditForm({
      lmsCourseId: deal.lmsMapping?.lmsCourseId || '',
      lmsGroupId: deal.lmsMapping?.lmsGroupId || '',
      courseType: deal.lmsMapping?.courseType || '',
      courseNameSnapshot: deal.lmsMapping?.courseNameSnapshot || '',
      groupNameSnapshot: deal.lmsMapping?.groupNameSnapshot || '',
    });
  }, [deal, editOpen]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error || !deal) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || 'Келишим табылган жок'}</p>
        <Button variant="outline" onClick={() => navigate('/deals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Артка
        </Button>
      </div>
    );
  }

  const paymentSummary = payments[0]?.dealPaymentSummary ?? null;

  const handleSaveLmsData = async () => {
    setIsSaving(true);
    try {
      const updatedDeal = await dealsApi.update(deal.id, {
        lmsCourseId: editForm.lmsCourseId,
        lmsGroupId: editForm.lmsGroupId,
        courseType: editForm.courseType || null,
        courseNameSnapshot: editForm.courseNameSnapshot,
        groupNameSnapshot: editForm.groupNameSnapshot,
      });
      setDeal(updatedDeal);
      setEditOpen(false);
      toast({
        title: 'Окуу маалыматы жаңыртылды',
        description: 'Келишимдеги курс жана группа сакталды.',
      });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Келишимди жаңыртуу ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseDraft = (message: string) => {
    setAiDraftMessage(message);
    toast({
      title: 'Сунуш кошулду',
      description: 'Сунушталган жооп төмөнкү талаага жайгаштырылды.',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Келишим #${deal.id}`}
        description={isLmsBridgeEnabled ? (deal.lmsMapping?.courseNameSnapshot || 'Окуу байланышы көрсөтүлгөн эмес') : undefined}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/deals')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Артка
            </Button>
            {isAiDraftsEnabled ? (
              <Button variant="outline" onClick={() => setIsAiDraftOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                AI жооп сунушу
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => navigate(`/payments?create=1&dealId=${deal.id}`)}>
              Төлөм кошуу
            </Button>
            {isLmsBridgeEnabled ? (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Продукт маалыматты оңдоо
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {aiDraftMessage ? (
          <AiDraftHandoffCard
            value={aiDraftMessage}
            onChange={setAiDraftMessage}
            onClear={() => setAiDraftMessage('')}
            className="lg:col-span-3"
          />
        ) : null}

        {isLmsBridgeEnabled && deal.lmsMapping ? (
          <DealCourseMapping
            lmsCourseId={deal.lmsMapping.lmsCourseId}
            lmsGroupId={deal.lmsMapping.lmsGroupId}
            courseType={deal.lmsMapping.courseType}
            courseNameSnapshot={deal.lmsMapping.courseNameSnapshot}
            groupNameSnapshot={deal.lmsMapping.groupNameSnapshot}
            dealId={deal.id}
            contactLmsStudentId={contactBridgeData?.lmsStudentId}
          />
        ) : null}

        <div className="space-y-4">
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Төлөмдөр
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentSummary ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <MiniMetric label="Жалпы сумма" value={`${paymentSummary.dealTotal.toLocaleString()} сом`} />
                  <MiniMetric label="Ырасталган төлөм" value={`${paymentSummary.confirmedPaid.toLocaleString()} сом`} />
                  <MiniMetric label="Депозит" value={`${paymentSummary.depositPaid.toLocaleString()} сом`} />
                  <MiniMetric label="Калганы" value={`${paymentSummary.remaining.toLocaleString()} сом`} />
                </div>
              ) : null}
              {paymentsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Төлөмдөр жүктөлүүдө...
                </div>
              ) : payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Бул келишим боюнча төлөм табылган жок.</p>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{payment.amount.toLocaleString()} сом</p>
                      <PaymentStatusBadge status={payment.paymentStatus || payment.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPaymentMethod(payment.method)}
                      {payment.paidAt ? ` • ${formatDate(payment.paidAt)}` : ''}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {isLmsBridgeEnabled && canViewIntegrationHistory() && contactBridgeData?.lmsStudentId ? (
            <Card className="shadow-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  Интеграция тарыхы
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/enrollments?crmDealId=${deal.id}${contactBridgeData.lmsStudentId ? `&studentId=${encodeURIComponent(contactBridgeData.lmsStudentId)}` : ''}`)}
                >
                  Толук тарых
                </Button>
              </CardHeader>
              <CardContent>
                <IntegrationHistoryPanel
                  initialFilters={{
                    crmDealId: deal.id,
                    crmContactId: contact?.id,
                    lmsStudentId: contactBridgeData.lmsStudentId,
                  }}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Окуу маалыматын оңдоо</DialogTitle>
          </DialogHeader>
          <LmsCourseContextFields
            value={{
              lmsCourseId: editForm.lmsCourseId,
              lmsGroupId: editForm.lmsGroupId,
              courseType: editForm.courseType,
              courseNameSnapshot: editForm.courseNameSnapshot,
              groupNameSnapshot: editForm.groupNameSnapshot,
            }}
            onChange={(next) => setEditForm(next)}
            courseLabel="Курс"
            groupLabel="Группа"
            description="Келишимдеги акыркы окуу тандоосу ушул жерде сакталат. Төлөм жана enrollment ушул мааниге таянат."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Жабуу
            </Button>
            <Button onClick={handleSaveLmsData} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Сактоо
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isAiDraftsEnabled ? (
        <AiDraftModal
          open={isAiDraftOpen}
          onOpenChange={setIsAiDraftOpen}
          targetType="deal"
          targetId={deal.id}
          targetName={`Келишим #${deal.id}`}
          onUseDraft={handleUseDraft}
        />
      ) : null}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status?: string }) {
  const variant =
    status === 'confirmed'
      ? 'default'
      : status === 'failed' || status === 'refunded' || status === 'overdue'
        ? 'destructive'
        : 'secondary';
  const label =
    status === 'submitted'
      ? 'Жиберилди'
      : status === 'confirmed'
        ? 'Ырасталды'
        : status === 'failed'
          ? 'Ишке ашкан жок'
          : status === 'refunded'
            ? 'Кайтарылды'
            : status === 'overdue'
              ? 'Мөөнөтү өткөн'
              : status || '—';
  return <Badge variant={variant}>{label}</Badge>;
}

function formatPaymentMethod(value?: string) {
  if (value === 'card') return 'Карта';
  if (value === 'qr') return 'QR';
  if (value === 'bank') return 'Банк';
  if (value === 'manual') return 'Кол менен';
  return value || '—';
}
