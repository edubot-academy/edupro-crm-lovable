import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { KanbanBoard, type KanbanColumn } from '@/components/KanbanBoard';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { ky } from '@/lib/i18n';
import { dealsApi, reportsApi } from '@/api/modules';
import type { Deal, DealStage, FunnelReport } from '@/types';
import { User, BookOpen, DollarSign } from 'lucide-react';

const stages: { id: DealStage; title: string }[] = [
  { id: 'new_lead', title: ky.dealStage.new_lead },
  { id: 'contacted', title: ky.dealStage.contacted },
  { id: 'trial_booked', title: ky.dealStage.trial_booked },
  { id: 'trial_completed', title: ky.dealStage.trial_completed },
  { id: 'offer_sent', title: ky.dealStage.offer_sent },
  { id: 'negotiation', title: ky.dealStage.negotiation },
  { id: 'payment_pending', title: ky.dealStage.payment_pending },
  { id: 'won', title: ky.dealStage.won },
  { id: 'lost', title: ky.dealStage.lost },
];

const mockDeals: Deal[] = [
  { id: 1, leadId: 1, lead: { id: 1, fullName: 'Азамат Токтогулов' }, courseNameSnapshot: 'Python', groupNameSnapshot: 'PY-24-1', amount: 15000, currency: 'KGS', stage: 'new_lead', createdAt: '2024-03-01', updatedAt: '2024-03-01' },
  { id: 2, leadId: 2, lead: { id: 2, fullName: 'Айгерим Сатыбалдиева' }, courseNameSnapshot: 'JavaScript', groupNameSnapshot: 'JS-24-1', amount: 16000, currency: 'KGS', stage: 'contacted', createdAt: '2024-03-02', updatedAt: '2024-03-02' },
  { id: 3, leadId: 3, lead: { id: 3, fullName: 'Бакыт Жумалиев' }, courseNameSnapshot: 'UI/UX', groupNameSnapshot: 'UX-24-1', amount: 18000, currency: 'KGS', stage: 'trial_booked', createdAt: '2024-03-03', updatedAt: '2024-03-03' },
  { id: 4, leadId: 4, lead: { id: 4, fullName: 'Гүлнара Касымова' }, courseNameSnapshot: 'English B1', groupNameSnapshot: 'EN-24-1', amount: 12000, currency: 'KGS', stage: 'offer_sent', createdAt: '2024-03-04', updatedAt: '2024-03-04' },
  { id: 5, leadId: 5, lead: { id: 5, fullName: 'Данияр Абдыраев' }, courseNameSnapshot: 'Data Science', groupNameSnapshot: 'DS-24-1', amount: 20000, currency: 'KGS', stage: 'payment_pending', createdAt: '2024-03-05', updatedAt: '2024-03-05' },
  { id: 6, leadId: 6, lead: { id: 6, fullName: 'Элнура Турдалиева' }, courseNameSnapshot: 'Python', groupNameSnapshot: 'PY-24-1', amount: 15000, currency: 'KGS', stage: 'won', createdAt: '2024-02-20', updatedAt: '2024-03-10' },
  { id: 7, leadId: 7, lead: { id: 7, fullName: 'Жаныл Бекова' }, courseNameSnapshot: 'JavaScript', groupNameSnapshot: 'JS-24-1', amount: 16000, currency: 'KGS', stage: 'negotiation', createdAt: '2024-03-06', updatedAt: '2024-03-06' },
  { id: 8, leadId: 8, lead: { id: 8, fullName: 'Кайрат Орозбеков' }, courseNameSnapshot: 'UI/UX', amount: 18000, currency: 'KGS', stage: 'lost', createdAt: '2024-03-07', updatedAt: '2024-03-07' },
];

const mockFunnel: FunnelReport = {
  stages: [
    { key: 'lead_created', label: 'Лид түзүлдү', count: 342, conversionFromPrevious: null, conversionFromStart: 100, avgDaysFromPrevious: null },
    { key: 'lead_contacted', label: 'Лид менен байланышылды', count: 260, conversionFromPrevious: 76, conversionFromStart: 76, avgDaysFromPrevious: 1.2 },
    { key: 'lead_qualified', label: 'Лид квалификациядан өттү', count: 214, conversionFromPrevious: 82.3, conversionFromStart: 62.6, avgDaysFromPrevious: 1.7 },
    { key: 'contact_created', label: 'Байланыш түзүлдү', count: 205, conversionFromPrevious: 95.8, conversionFromStart: 59.9, avgDaysFromPrevious: 0.5 },
    { key: 'deal_created', label: 'Келишим түзүлдү', count: 176, conversionFromPrevious: 85.9, conversionFromStart: 51.5, avgDaysFromPrevious: 1.1 },
    { key: 'trial_scheduled', label: 'Сыноо пландалды', count: 120, conversionFromPrevious: 68.2, conversionFromStart: 35.1, avgDaysFromPrevious: 1.4 },
    { key: 'trial_completed', label: 'Сыноо өттү', count: 98, conversionFromPrevious: 81.7, conversionFromStart: 28.7, avgDaysFromPrevious: 2.1 },
    { key: 'payment_submitted', label: 'Төлөм жөнөтүлдү', count: 84, conversionFromPrevious: 85.7, conversionFromStart: 24.6, avgDaysFromPrevious: 1.8 },
    { key: 'payment_confirmed', label: 'Төлөм ырасталды', count: 71, conversionFromPrevious: 84.5, conversionFromStart: 20.8, avgDaysFromPrevious: 0.9 },
    { key: 'enrollment_requested', label: 'LMS каттоо түзүлдү', count: 69, conversionFromPrevious: 97.2, conversionFromStart: 20.2, avgDaysFromPrevious: 0.2 },
    { key: 'enrollment_activated', label: 'LMS жеткиликтүүлүк ачылды', count: 66, conversionFromPrevious: 95.7, conversionFromStart: 19.3, avgDaysFromPrevious: 0.3 },
    { key: 'won', label: 'Утту', count: 66, conversionFromPrevious: 100, conversionFromStart: 19.3, avgDaysFromPrevious: 0 },
  ],
  dropOffs: [
    { key: 'lead_disqualified', count: 31 },
    { key: 'deal_lost', count: 19 },
    { key: 'payment_failed', count: 7 },
    { key: 'enrollment_cancelled', count: 3 },
  ],
};

const dropOffLabels: Record<string, string> = {
  lead_disqualified: 'Лид четтетилди',
  deal_lost: 'Келишим жоголду',
  payment_failed: 'Төлөм ишке ашкан жок',
  enrollment_cancelled: 'Каттоо жокко чыгарылды',
};

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [funnel, setFunnel] = useState<FunnelReport>(mockFunnel);
  const [isLoading, setIsLoading] = useState(true);
  const [activeColumn, setActiveColumn] = useState<string>('new_lead');

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      dealsApi.list().catch(() => ({ items: mockDeals })),
      reportsApi.getFunnel().catch(() => mockFunnel),
    ])
      .then(([dealsResult, funnelResult]) => {
        setDeals(dealsResult.items);
        setFunnel(funnelResult);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const columns: KanbanColumn<Deal>[] = stages.map((stage) => ({
    id: stage.id,
    title: stage.title,
    items: deals.filter((d) => d.stage === stage.id),
  }));

  const renderCard = (deal: Deal) => (
    <Card className="shadow-soft border-border/50 hover:shadow-medium transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium truncate">{deal.lead?.fullName || deal.contact?.fullName || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{deal.courseNameSnapshot || '—'}</span>
          {deal.groupNameSnapshot && <span className="text-xs text-muted-foreground">• {deal.groupNameSnapshot}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">{deal.amount.toLocaleString()} {deal.currency || 'сом'}</span>
          </div>
          <StatusBadge variant={getLeadStatusVariant(deal.stage)}>
            {ky.dealStage[deal.stage]}
          </StatusBadge>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return <div className="flex items-center justify-center h-64"><span className="text-muted-foreground">{ky.common.loading}</span></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.nav.pipeline} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {funnel.stages.map((stage) => (
          <Card key={stage.key} className="shadow-soft border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stage.label}</p>
              <p className="mt-1 text-2xl font-semibold">{stage.count}</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>
                  Мурункудан: {stage.conversionFromPrevious == null ? '—' : `${stage.conversionFromPrevious.toFixed(1)}%`}
                </p>
                <p>
                  Башынан: {stage.conversionFromStart == null ? '—' : `${stage.conversionFromStart.toFixed(1)}%`}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {funnel.dropOffs.map((dropOff) => (
          <Card key={dropOff.key} className="border-destructive/20 bg-destructive/5 shadow-soft">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{dropOffLabels[dropOff.key] || dropOff.key}</p>
              <p className="mt-1 text-xl font-semibold">{dropOff.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <KanbanBoard
        columns={columns}
        renderCard={renderCard}
        activeColumn={activeColumn}
        onColumnChange={setActiveColumn}
      />
    </div>
  );
}
