import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Workflow } from 'lucide-react';
import { useLmsIntegrationHistory } from '@/hooks/use-lms';
import { useRolePermissions } from '@/hooks/use-role-permissions';

const statusVariant = (status?: string | null) => {
  if (status === 'success' || status === 'received' || status === 'active') return 'default' as const;
  if (status === 'retrying' || status === 'pending') return 'secondary' as const;
  if (status === 'error' || status === 'failed' || status === 'cancelled') return 'destructive' as const;
  return 'outline' as const;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ky-KG');
};

export function IntegrationHistoryPanel({ initialFilters }: { initialFilters?: Record<string, string | number | undefined> }) {
  const { canViewIntegrationHistory } = useRolePermissions();
  const canViewHistory = canViewIntegrationHistory();

  const [filters, setFilters] = useState({
    crmLeadId: '',
    crmContactId: '',
    crmDealId: '',
    crmPaymentId: '',
    lmsStudentId: '',
    lmsEnrollmentId: '',
  });
  const [submittedFilters, setSubmittedFilters] = useState<Record<string, string | number | undefined>>(initialFilters || {});

  useEffect(() => {
    if (!initialFilters) return;
    setFilters((prev) => ({
      ...prev,
      crmLeadId: String(initialFilters.crmLeadId || ''),
      crmContactId: String(initialFilters.crmContactId || ''),
      crmDealId: String(initialFilters.crmDealId || ''),
      crmPaymentId: String(initialFilters.crmPaymentId || ''),
      lmsStudentId: String(initialFilters.lmsStudentId || ''),
      lmsEnrollmentId: String(initialFilters.lmsEnrollmentId || ''),
    }));
    setSubmittedFilters(initialFilters);
  }, [initialFilters]);

  const queryParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(submittedFilters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
      ),
    [submittedFilters],
  );

  const { data, isLoading, isError } = useLmsIntegrationHistory(queryParams);

  const handleSearch = () => {
    setSubmittedFilters({
      ...filters,
      limit: 30,
    });
  };
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const items = data?.data || [];

  if (!canViewHistory) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          Интеграция тарыхы
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input placeholder="CRM лид ID" aria-label="CRM лид идентификатору" value={filters.crmLeadId} onChange={(e) => setFilters((prev) => ({ ...prev, crmLeadId: e.target.value }))} onKeyDown={handleSearchKeyDown} />
          <Input placeholder="CRM контакт ID" aria-label="CRM байланыш идентификатору" value={filters.crmContactId} onChange={(e) => setFilters((prev) => ({ ...prev, crmContactId: e.target.value }))} onKeyDown={handleSearchKeyDown} />
          <Input placeholder="CRM келишим ID" aria-label="CRM келишим идентификатору" value={filters.crmDealId} onChange={(e) => setFilters((prev) => ({ ...prev, crmDealId: e.target.value }))} onKeyDown={handleSearchKeyDown} />
          <Input placeholder="CRM төлөм ID" aria-label="CRM төлөм идентификатору" value={filters.crmPaymentId} onChange={(e) => setFilters((prev) => ({ ...prev, crmPaymentId: e.target.value }))} onKeyDown={handleSearchKeyDown} />
          <Input placeholder="LMS студент ID" aria-label="LMS студент идентификатору" value={filters.lmsStudentId} onChange={(e) => setFilters((prev) => ({ ...prev, lmsStudentId: e.target.value }))} onKeyDown={handleSearchKeyDown} />
          <Input placeholder="LMS каттоо ID" aria-label="LMS каттоо идентификатору" value={filters.lmsEnrollmentId} onChange={(e) => setFilters((prev) => ({ ...prev, lmsEnrollmentId: e.target.value }))} onKeyDown={handleSearchKeyDown} />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSearch} variant="secondary" className="gap-2" aria-label="Интеграция тарыхын издөө">
            <Search className="h-4 w-4" />
            Издөө
          </Button>
        </div>

        {!Object.keys(queryParams).length && (
          <p className="text-sm text-muted-foreground">
            Тарыхты көрүү үчүн жок дегенде бир идентификатор киргизиңиз.
          </p>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Жүктөлүүдө...</p>}
        {isError && <p className="text-sm text-destructive">Интеграция тарыхын жүктөө мүмкүн болбоду.</p>}

        {!isLoading && !isError && Object.keys(queryParams).length > 0 && (
          <ScrollArea className="h-[360px] pr-3">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-medium">
                        {item.source === 'outbound' ? 'CRM → LMS' : 'LMS → CRM'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.endpoint || '—'} · {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(item.status)}>{item.status || '—'}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p>Request ID: {item.requestId || '—'}</p>
                    <p>Event ID: {item.eventId || '—'}</p>
                    <p>CRM лид: {item.crmLeadId || '—'}</p>
                    <p>CRM контакт: {item.crmContactId || '—'}</p>
                    <p>CRM келишим: {item.crmDealId || '—'}</p>
                    <p>CRM төлөм: {item.crmPaymentId || '—'}</p>
                    <p>LMS студент: {item.lmsStudentId || '—'}</p>
                    <p>LMS каттоо: {item.lmsEnrollmentId || '—'}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap text-xs">
                    {item.httpStatus ? <Badge variant="outline">HTTP {item.httpStatus}</Badge> : null}
                    {item.enrollmentStatus ? <Badge variant="outline">Статус: {item.enrollmentStatus}</Badge> : null}
                    {item.errorCode ? <Badge variant="destructive">{item.errorCode}</Badge> : null}
                  </div>

                  {item.message ? (
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                  ) : null}
                </div>
              ))}

              {items.length === 0 && (
                <p className="text-sm text-muted-foreground">Бул фильтрлер боюнча тарых табылган жок.</p>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
