import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Phone } from 'lucide-react';
import type { TimelineEvent } from '@/types';
import { timelineApi } from '@/api/modules';
import { cn } from '@/lib/utils';

type Props = {
  leadId?: number;
  contactId?: number;
  refreshKey?: number;
};

function getScheduledAt(event: TimelineEvent): string | null {
  return typeof event.meta?.scheduledAt === 'string' && event.meta.scheduledAt
    ? event.meta.scheduledAt
    : null;
}

function getScheduleStatus(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) {
    return {
      label: 'Белгисиз',
      className: 'border-slate-200 bg-slate-100 text-slate-700',
    };
  }

  const diffMs = date.getTime() - Date.now();

  if (diffMs < 0) {
    return {
      label: 'Өтүп кеткен',
      className: 'border-red-200 bg-red-100 text-red-700',
    };
  }

  if (diffMs <= 60 * 60 * 1000) {
    return {
      label: 'Жакында',
      className: 'border-amber-200 bg-amber-100 text-amber-800',
    };
  }

  if (diffMs <= 24 * 60 * 60 * 1000) {
    return {
      label: 'Бүгүн',
      className: 'border-sky-200 bg-sky-100 text-sky-800',
    };
  }

  return {
    label: 'Пландалган',
    className: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  };
}

export function ScheduledTimelineEventsCard({
  leadId,
  contactId,
  refreshKey = 0,
}: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = useCallback(() => {
    if (!leadId && !contactId) {
      setEvents([]);
      return;
    }

    setIsLoading(true);
    const loadAllPages = async () => {
      const firstPage = await timelineApi.list({
        leadId,
        contactId,
        page: 1,
        limit: 100,
      });
      const items = [...firstPage.items];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await timelineApi.list({ leadId, contactId, page, limit: 100 });
        items.push(...nextPage.items);
      }

      return items;
    };

    loadAllPages()
      .then((items) => {
        const now = Date.now();
        const scheduled = items
          .filter((event) => event.type === 'call' || event.type === 'meeting')
          .filter((event) => getScheduledAt(event))
          .map((event) => ({ event, scheduledAt: getScheduledAt(event)! }))
          .sort((a, b) => {
            const aTime = new Date(a.scheduledAt).getTime();
            const bTime = new Date(b.scheduledAt).getTime();
            const aIsPast = aTime < now;
            const bIsPast = bTime < now;

            if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
            return aTime - bTime;
          })
          .slice(0, 6)
          .map(({ event }) => event);

        setEvents(scheduled);
      })
      .catch(() => setEvents([]))
      .finally(() => setIsLoading(false));
  }, [contactId, leadId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshKey]);

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Пландалган байланыштар
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Пландалган байланыштар жүктөлүүдө...
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пландалган чалуу же жолугушуу жок.</p>
        ) : (
          events.map((event) => {
            const scheduledAt = getScheduledAt(event);
            const date = scheduledAt ? new Date(scheduledAt) : null;
            const scheduleStatus = getScheduleStatus(date);

            return (
              <div key={event.id} className="rounded-md border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {event.type === 'call' ? <Phone className="h-4 w-4 text-primary" /> : <Calendar className="h-4 w-4 text-primary" />}
                    <p className="text-sm font-medium">
                      {event.type === 'call' ? 'Чалуу' : 'Жолугушуу'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('border', scheduleStatus.className)}
                  >
                    {scheduleStatus.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {date && !Number.isNaN(date.getTime())
                    ? date.toLocaleString('ky-KG', { dateStyle: 'short', timeStyle: 'short' })
                    : 'Убакыты белгисиз'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.message || 'Комментарий жок'}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
