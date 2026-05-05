import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/PageShell';
import { KanbanBoard, type KanbanColumn } from '@/components/KanbanBoard';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { ky } from '@/lib/i18n';
import { dealsApi } from '@/api/modules';
import type { Deal, DealPipelineStage } from '@/types';
import { getDealPipelineStage } from '@/lib/crm-status';
import { useTenantConfig } from '@/components/core/TenantConfigProvider';
import { User, DollarSign } from 'lucide-react';

export default function PipelinePage() {
  const { tenantConfig } = useTenantConfig();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeColumn, setActiveColumn] = useState<string>('new');

  // Use tenant-configured pipeline stages if available, otherwise use hardcoded stages
  const stages = useMemo(() => {
    if (tenantConfig.pipelineStages && tenantConfig.pipelineStages.length > 0) {
      return tenantConfig.pipelineStages.map(stage => ({
        id: stage.key as DealPipelineStage,
        title: stage.label,
      }));
    }
    // Fallback to hardcoded CRM-native stages (no education-specific trial stage)
    return [
      { id: 'new', title: ky.dealPipelineStage.new },
      { id: 'consultation', title: ky.dealPipelineStage.consultation },
      { id: 'negotiation', title: ky.dealPipelineStage.negotiation },
      { id: 'payment_pending', title: ky.dealPipelineStage.payment_pending },
      { id: 'won', title: ky.dealPipelineStage.won },
      { id: 'lost', title: ky.dealPipelineStage.lost },
    ];
  }, [tenantConfig.pipelineStages]);

  const fetchAllDeals = useCallback(async () => {
    const firstPage = await dealsApi.list({ page: 1, limit: 20 });
    const allDeals = [...firstPage.items];
    const totalPages = Math.max(firstPage.totalPages || 1, 1);

    for (let page = 2; page <= totalPages; page += 1) {
      const response = await dealsApi.list({ page, limit: 20 });
      allDeals.push(...response.items);
    }

    return allDeals;
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchAllDeals()
      .then((allDeals) => {
        setDeals(allDeals);
      })
      .catch(() => {
        setDeals([]);
      })
      .finally(() => setIsLoading(false));
  }, [fetchAllDeals]);

  const columns: KanbanColumn<Deal>[] = stages.map((stage) => ({
    id: stage.id,
    title: stage.title,
    items: deals.filter((d) => getDealPipelineStage(d, tenantConfig.pipelineStages) === stage.id),
  }));

  const stageSummaries = useMemo(() => {
    const summaryStages = stages
      .filter((stage) => stage.id !== 'lost')
      .map((stage) => ({
        id: stage.id,
        title: stage.title,
        count: deals.filter((deal) => getDealPipelineStage(deal, tenantConfig.pipelineStages) === stage.id).length,
      }));

    return summaryStages.map((stage, index) => {
      const firstCount = summaryStages[0]?.count ?? 0;
      const previousCount = index > 0 ? summaryStages[index - 1].count : 0;

      return {
        ...stage,
        conversionFromPrevious:
          index === 0 || previousCount <= 0
            ? null
            : Number(((stage.count / previousCount) * 100).toFixed(1)),
        conversionFromStart:
          firstCount <= 0
            ? null
            : Number(((stage.count / firstCount) * 100).toFixed(1)),
      };
    });
  }, [deals, stages, tenantConfig.pipelineStages]);

  const lostDealsCount = useMemo(
    () => deals.filter((deal) => getDealPipelineStage(deal, tenantConfig.pipelineStages) === 'lost').length,
    [deals, tenantConfig.pipelineStages],
  );

  const renderCard = (deal: Deal) => (
    <Card className="shadow-soft border-border/50 hover:shadow-medium transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium truncate">{deal.lead?.fullName || deal.contact?.fullName || '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">{deal.amount.toLocaleString()} {tenantConfig.currency}</span>
          </div>
          {(() => { const stage = getDealPipelineStage(deal); return <StatusBadge variant={getLeadStatusVariant(stage)}>{stages.find(s => s.id === stage)?.title || ky.dealPipelineStage[stage]}</StatusBadge>; })()}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return <div className="flex items-center justify-center h-64"><span className="text-muted-foreground">{ky.common.loading}</span></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.nav.pipeline} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stageSummaries.map((stage) => (
          <Card key={stage.id} className="shadow-soft border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stage.title}</p>
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
      <Card className="border-destructive/20 bg-destructive/5 shadow-soft">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Жоголгон келишимдер</p>
          <p className="mt-1 text-xl font-semibold">{lostDealsCount}</p>
        </CardContent>
      </Card>
      <KanbanBoard
        columns={columns}
        renderCard={renderCard}
        activeColumn={activeColumn}
        onColumnChange={setActiveColumn}
      />
    </div>
  );
}
