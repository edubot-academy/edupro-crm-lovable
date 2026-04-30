import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge, getRiskSeverityVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ky } from '@/lib/i18n';
import { formatDate } from '@/lib/formatting';
import type { RetentionCase } from '@/types';
import type { RetentionCaseWithLmsData } from '@/types/bridge';
import { retentionApi } from '@/api/modules';
import { Phone, ArrowUpCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';
import { useRolePermissions } from '@/hooks/use-role-permissions';

const caseStatusVariant = (s: string) => {
  switch (s) { case 'open': return 'destructive' as const; case 'contacted': return 'warning' as const; case 'monitoring': return 'info' as const; case 'resolved': return 'success' as const; case 'escalated': return 'info' as const; default: return 'default' as const; }
};
const caseStatusLabel: Record<string, string> = { open: 'Ачык', contacted: 'Байланышылды', monitoring: 'Көзөмөлдө', resolved: 'Чечилди', escalated: 'Жогорулатылды' };

export default function RetentionPage() {
  const { toast } = useToast();
  const [cases, setCases] = useState<RetentionCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<RetentionCase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCases = () => {
    setIsLoading(true);
    retentionApi.list({ search, status: statusFilter === 'all' ? undefined : statusFilter })
      .then((res) => {
        setCases(res.items);
        setTotalItems(res.total || 0);
      })
      .catch(() => {
        setCases([]);
        setTotalItems(0);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchCases(); }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await retentionApi.delete(deleteTarget.id);
      toast({ title: 'Учур ийгиликтүү өчүрүлдү' });
      setDeleteTarget(null);
      fetchCases();
    } catch {
      toast({ title: 'Өчүрүү ишке ашкан жок', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContact = async (id: number) => {
    try {
      await retentionApi.contact(id);
      toast({ title: 'Статус "Байланышталды" деп белгиледи' });
      fetchCases();
    } catch {
      toast({ title: 'Статус өзгөртүү ишке ашкан жок', variant: 'destructive' });
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await retentionApi.resolve(id);
      toast({ title: 'Учур ийгиликтүү чечилди' });
      fetchCases();
    } catch {
      toast({ title: 'Чечүү ишке ашкан жок', variant: 'destructive' });
    }
  };

  const handleEscalate = async (id: number) => {
    try {
      await retentionApi.escalate(id);
      toast({ title: 'Учур ийгиликтүү жогорулатылды' });
      fetchCases();
    } catch {
      toast({ title: 'Жогорулатуу ишке ашкан жок', variant: 'destructive' });
    }
  };

  const filtered = cases.filter((c) => statusFilter === 'all' || c.status === statusFilter);
  const mobileBoardColumns = Object.entries(caseStatusLabel)
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
        label: `Статус: ${caseStatusLabel[statusFilter]}`,
        onRemove: () => setStatusFilter('all'),
      }]
      : []),
  ];
  const headerActions = (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус</p>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бардык статус</SelectItem>
            {Object.entries(caseStatusLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="hidden items-center gap-2 text-xs text-muted-foreground xl:flex">
        <span className="rounded-full bg-secondary px-2.5 py-1">{totalItems} учур</span>
        <span className="rounded-full bg-secondary px-2.5 py-1">
          {cases.filter((item) => item.status === 'open').length} ачык
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1">
          {cases.filter((item) => item.status === 'escalated').length} жогорулатылган
        </span>
      </div>
    </div>
  );

  const columns: Column<RetentionCase>[] = [
    {
      key: 'summary', header: ky.retention.summary, render: (c) => (
        <div>
          <span className="font-medium">{c.summary || '—'}</span>
        </div>
      )
    },
    { key: 'issueType', header: ky.retention.issueType, render: (c) => <span className="text-sm">{ky.issueType[c.issueType]}</span> },
    { key: 'severity', header: ky.retention.severity, render: (c) => <StatusBadge variant={getRiskSeverityVariant(c.severity)} dot>{ky.riskSeverity[c.severity]}</StatusBadge> },
    { key: 'lastActivityAt', header: ky.retention.lastActivity, render: (c) => c.lastActivityAt ? formatDate(c.lastActivityAt) : '—', className: 'hidden md:table-cell' },
    { key: 'assignedTo', header: ky.common.manager, render: (c) => c.assignedTo?.fullName || '—', className: 'hidden lg:table-cell' },
    { key: 'status', header: ky.common.status, render: (c) => <StatusBadge variant={caseStatusVariant(c.status)} dot>{caseStatusLabel[c.status]}</StatusBadge> },
    {
      key: 'actions', header: ky.common.actions, render: (c) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs" title={ky.retention.contactStudent} aria-label={`${c.summary || 'Учур'}: ${ky.retention.contactStudent.toLowerCase()}`} onClick={() => handleContact(c.id)}><Phone className="h-3.5 w-3.5" /></Button>
          {c.status === 'open' && <Button variant="ghost" size="sm" className="h-7 text-xs text-success" title={ky.retention.resolve} aria-label={`${c.summary || 'Учур'}: ${ky.retention.resolve.toLowerCase()}`} onClick={() => handleResolve(c.id)}><CheckCircle className="h-3.5 w-3.5" /></Button>}
          {(c.status === 'open' || c.status === 'contacted') && <Button variant="ghost" size="sm" className="h-7 text-xs text-warning" title={ky.retention.escalate} aria-label={`${c.summary || 'Учур'}: ${ky.retention.escalate.toLowerCase()}`} onClick={() => handleEscalate(c.id)}><ArrowUpCircle className="h-3.5 w-3.5" /></Button>}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }} aria-label={`${ky.common.delete} ${c.summary || 'учур'}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    },
  ];

  const renderMobileCard = (retentionCase: RetentionCase) => (
    <Card className="shadow-card border-border/50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{retentionCase.summary || '—'}</p>
            <p className="mt-1 text-xs text-muted-foreground">{ky.issueType[retentionCase.issueType]}</p>
          </div>
          <StatusBadge variant={getRiskSeverityVariant(retentionCase.severity)} dot>{ky.riskSeverity[retentionCase.severity]}</StatusBadge>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-muted/60 p-2">
            <p className="text-xs text-muted-foreground">{ky.common.status}</p>
            <p className="font-medium">{caseStatusLabel[retentionCase.status]}</p>
          </div>
          <div className="rounded-md bg-muted/60 p-2">
            <p className="text-xs text-muted-foreground">{ky.retention.lastActivity}</p>
            <p className="font-medium">{retentionCase.lastActivityAt ? formatDate(retentionCase.lastActivityAt) : '—'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{retentionCase.assignedTo?.fullName || 'Менеджер жок'}</div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={ky.retention.contactStudent} onClick={(e) => { e.stopPropagation(); handleContact(retentionCase.id); }}><Phone className="h-3.5 w-3.5" /></Button>
            {retentionCase.status === 'open' && <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-success" title={ky.retention.resolve} onClick={(e) => { e.stopPropagation(); handleResolve(retentionCase.id); }}><CheckCircle className="h-3.5 w-3.5" /></Button>}
            {(retentionCase.status === 'open' || retentionCase.status === 'contacted') && <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-warning" title={ky.retention.escalate} onClick={(e) => { e.stopPropagation(); handleEscalate(retentionCase.id); }}><ArrowUpCircle className="h-3.5 w-3.5" /></Button>}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(retentionCase); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title={ky.retention.title} description="Тобокелдик учурларды көзөмөлдөп, чара көрүүнү талап кылгандарды биринчи орунга чыгарыңыз." />
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Учур издөө..."
        headerActions={headerActions}
        activeFilters={activeFilters}
        totalItems={totalItems}
        totalItemsLabel="учур"
        stickyHeader
        renderMobileCard={renderMobileCard}
        mobileBoardColumns={mobileBoardColumns}
        getMobileBoardColumnId={(retentionCase) => retentionCase.status}
        mobileBoardEmptyMessage="Бул тилкеде учур жок"
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ky.retention.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{ky.retention.deleteConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{ky.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {ky.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
