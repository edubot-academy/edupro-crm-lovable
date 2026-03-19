import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, BookOpen, CreditCard, Workflow, User, CalendarDays, Clock3, Users } from 'lucide-react';
import { contactApi, dealsApi, paymentsApi } from '@/api/modules';
import type { Contact, Deal, Payment } from '@/types';
import { useLmsGroups } from '@/hooks/use-lms';
import { formatLmsDate, getLmsGroupAvailability, getSeatsLeft } from '@/lib/lms-availability';
import { IntegrationHistoryPanel } from '@/components/lms/IntegrationHistoryPanel';

export default function DealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    dealsApi.get(Number(id))
      .then(async (dealResult) => {
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
      })
      .catch(() => setError('Келишим табылган жок'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setPaymentsLoading(true);
    paymentsApi.list({ dealId: id, limit: 100 })
      .then((res) => setPayments(res.items))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
  }, [id]);

  const { data: groupsData } = useLmsGroups(
    deal?.lmsCourseId ? { courseId: deal.lmsCourseId, limit: 100 } : undefined,
  );

  const liveGroup = useMemo(
    () => groupsData?.items?.find((group) => group.id === deal?.lmsGroupId) ?? null,
    [groupsData?.items, deal?.lmsGroupId],
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{error || 'Келишим табылган жок'}</p>
        <Button variant="outline" onClick={() => navigate('/deals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Артка
        </Button>
      </div>
    );
  }

  const availability = liveGroup ? getLmsGroupAvailability(liveGroup) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Келишим #${deal.id}`}
        description={deal.courseNameSnapshot || 'LMS курс байланышы жок'}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/deals')}>
              <ArrowLeft className="mr-2 h-4 w-4" />Артка
            </Button>
            {deal.lmsCourseId && (
              <Button
                variant="outline"
                onClick={() => navigate(`/enrollments?crmDealId=${deal.id}${contact?.lmsStudentId ? `&studentId=${encodeURIComponent(contact.lmsStudentId)}` : ''}`)}
              >
                LMS каттоо
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Сатылган LMS маалымат
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Курс" value={deal.courseNameSnapshot || deal.lmsCourseId || '—'} />
              <DetailItem label="Топ" value={deal.groupNameSnapshot || deal.lmsGroupId || '—'} />
              <DetailItem label="Курс түрү" value={formatCourseType(deal.courseType)} />
              <DetailItem label="Студент" value={deal.contact?.fullName || contact?.fullName || '—'} icon={User} />
            </div>

            {liveGroup ? (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{liveGroup.name}</p>
                    <p className="text-sm text-muted-foreground">{liveGroup.teacherName || 'Мугалим дайындала элек'}</p>
                  </div>
                  {availability && <Badge variant={availability.tone}>{availability.label}</Badge>}
                </div>
                <div className="grid gap-3 sm:grid-cols-3 text-sm">
                  <MiniMetric icon={CalendarDays} label="Башталышы" value={formatLmsDate(liveGroup.startDate) || 'Такталган эмес'} />
                  <MiniMetric icon={Clock3} label="График" value={liveGroup.schedule || 'Такталган эмес'} />
                  <MiniMetric
                    icon={Users}
                    label="Орундар"
                    value={
                      liveGroup.capacity != null
                        ? `${liveGroup.currentStudentCount ?? 0}/${liveGroup.capacity}${getSeatsLeft(liveGroup) != null ? ` • Бош: ${getSeatsLeft(liveGroup)}` : ''}`
                        : 'Чектелген эмес'
                    }
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Тандалган топ боюнча түз LMS маалыматы табылган жок.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Төлөмдөр
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Төлөмдөр жүктөлүүдө...
                </div>
              ) : payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Бул келишим боюнча төлөм табылган жок.</p>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{payment.amount.toLocaleString()} сом</p>
                      <PaymentStatusBadge status={payment.paymentStatus || payment.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPaymentMethod(payment.method)}
                      {payment.paidAt ? ` • ${new Date(payment.paidAt).toLocaleDateString('ky-KG')}` : ''}
                    </p>
                    {payment.lmsEnrollmentId && (
                      <p className="text-xs text-muted-foreground">LMS каттоо ID: {payment.lmsEnrollmentId}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                Интеграция тарыхы
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/enrollments?crmDealId=${deal.id}${contact?.lmsStudentId ? `&studentId=${encodeURIComponent(contact.lmsStudentId)}` : ''}`)}
              >
                Толук тарых
              </Button>
            </CardHeader>
            <CardContent>
              <IntegrationHistoryPanel
                initialFilters={{
                  crmDealId: deal.id,
                  crmContactId: contact?.id,
                  lmsStudentId: contact?.lmsStudentId,
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="text-sm font-medium mt-1">{value}</p>
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

function formatCourseType(value?: string | null) {
  if (value === 'video') return 'Видео';
  if (value === 'offline') return 'Оффлайн';
  if (value === 'online_live') return 'Онлайн түз эфир';
  return '—';
}

function formatPaymentMethod(value?: string) {
  if (value === 'card') return 'Карта';
  if (value === 'qr') return 'QR';
  if (value === 'bank') return 'Банк';
  if (value === 'manual') return 'Кол менен';
  return value || '—';
}
