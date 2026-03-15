import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { KanbanBoard, type KanbanColumn } from '@/components/KanbanBoard';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { ky } from '@/lib/i18n';
import { dealsApi } from '@/api/modules';
import type { Deal, DealStage } from '@/types';
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
  { id: 1, contact: { id: 1, fullName: 'Азамат Токтогулов' }, courseNameSnapshot: 'Python', groupNameSnapshot: 'PY-24-1', amount: 15000, currency: 'KGS', stage: 'new_lead', createdAt: '2024-03-01', updatedAt: '2024-03-01' },
  { id: 2, contact: { id: 2, fullName: 'Айгерим Сатыбалдиева' }, courseNameSnapshot: 'JavaScript', groupNameSnapshot: 'JS-24-1', amount: 16000, currency: 'KGS', stage: 'contacted', createdAt: '2024-03-02', updatedAt: '2024-03-02' },
  { id: 3, contact: { id: 3, fullName: 'Бакыт Жумалиев' }, courseNameSnapshot: 'UI/UX', groupNameSnapshot: 'UX-24-1', amount: 18000, currency: 'KGS', stage: 'trial_booked', createdAt: '2024-03-03', updatedAt: '2024-03-03' },
  { id: 4, contact: { id: 4, fullName: 'Гүлнара Касымова' }, courseNameSnapshot: 'English B1', groupNameSnapshot: 'EN-24-1', amount: 12000, currency: 'KGS', stage: 'offer_sent', createdAt: '2024-03-04', updatedAt: '2024-03-04' },
  { id: 5, contact: { id: 5, fullName: 'Данияр Абдыраев' }, courseNameSnapshot: 'Data Science', groupNameSnapshot: 'DS-24-1', amount: 20000, currency: 'KGS', stage: 'payment_pending', createdAt: '2024-03-05', updatedAt: '2024-03-05' },
  { id: 6, contact: { id: 6, fullName: 'Элнура Турдалиева' }, courseNameSnapshot: 'Python', groupNameSnapshot: 'PY-24-1', amount: 15000, currency: 'KGS', stage: 'won', createdAt: '2024-02-20', updatedAt: '2024-03-10' },
  { id: 7, contact: { id: 7, fullName: 'Жаныл Бекова' }, courseNameSnapshot: 'JavaScript', groupNameSnapshot: 'JS-24-1', amount: 16000, currency: 'KGS', stage: 'negotiation', createdAt: '2024-03-06', updatedAt: '2024-03-06' },
  { id: 8, contact: { id: 8, fullName: 'Кайрат Орозбеков' }, courseNameSnapshot: 'UI/UX', amount: 18000, currency: 'KGS', stage: 'lost', createdAt: '2024-03-07', updatedAt: '2024-03-07' },
];

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeColumn, setActiveColumn] = useState<string>('new_lead');

  useEffect(() => {
    setIsLoading(true);
    dealsApi.list()
      .then((res) => setDeals(res.items))
      .catch(() => setDeals(mockDeals))
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
          <span className="text-sm font-medium truncate">{deal.contact?.fullName || '—'}</span>
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
      <KanbanBoard
        columns={columns}
        renderCard={renderCard}
        activeColumn={activeColumn}
        onColumnChange={setActiveColumn}
      />
    </div>
  );
}
