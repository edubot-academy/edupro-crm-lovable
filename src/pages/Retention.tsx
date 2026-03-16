import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge, getRiskSeverityVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ky } from '@/lib/i18n';
import type { RetentionCase } from '@/types';
import { retentionApi } from '@/api/modules';
import { Filter, Phone, ArrowUpCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const caseStatusVariant = (s: string) => {
  switch (s) { case 'open': return 'destructive' as const; case 'contacted': return 'warning' as const; case 'monitoring': return 'info' as const; case 'resolved': return 'success' as const; case 'escalated': return 'info' as const; default: return 'default' as const; }
};
const caseStatusLabel: Record<string, string> = { open: 'Ачык', contacted: 'Байланышылды', monitoring: 'Көзөмөлдө', resolved: 'Чечилди', escalated: 'Жогорулатылды' };

const mockCases: RetentionCase[] = [
  { id: 1, leadId: 1, lmsStudentId: 's1', lmsCourseId: 'c1', lmsGroupId: 'g1', issueType: 'low_attendance', severity: 'high', lastActivityAt: '2024-03-05', assignedTo: { id: 2, fullName: 'Айбек' }, status: 'open', summary: 'Катышуу төмөн', createdAt: '2024-03-09', updatedAt: '2024-03-09' },
  { id: 2, leadId: 2, lmsStudentId: 's2', lmsCourseId: 'c2', lmsGroupId: 'g2', issueType: 'low_homework_completion', severity: 'medium', lastActivityAt: '2024-03-07', assignedTo: { id: 1, fullName: 'Нургуль' }, status: 'contacted', summary: 'Үй тапшырма аткаруусу төмөн', createdAt: '2024-03-08', updatedAt: '2024-03-09' },
  { id: 3, leadId: 3, lmsStudentId: 's3', lmsCourseId: 'c4', lmsGroupId: 'g3', issueType: 'inactive_student', severity: 'critical', lastActivityAt: '2024-02-28', assignedTo: { id: 4, fullName: 'Жылдыз' }, status: 'escalated', summary: 'Активдүү эмес', createdAt: '2024-03-07', updatedAt: '2024-03-09' },
  { id: 4, leadId: 4, lmsStudentId: 's4', lmsCourseId: 'c3', lmsGroupId: 'g4', issueType: 'low_quiz_participation', severity: 'low', lastActivityAt: '2024-03-08', assignedTo: { id: 3, fullName: 'Эрлан' }, status: 'resolved', summary: 'Кошумча сабактар жардам берди', createdAt: '2024-03-06', updatedAt: '2024-03-09' },
];

export default function RetentionPage() {
  const { toast } = useToast();
  const [cases, setCases] = useState<RetentionCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<RetentionCase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCases = () => {
    setIsLoading(true);
    retentionApi.list({ search, status: statusFilter === 'all' ? undefined : statusFilter })
      .then((res) => setCases(res.items))
      .catch(() => setCases(mockCases))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchCases(); }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await retentionApi.delete(deleteTarget.id);
      toast({ title: ky.retention.deleteSuccess });
      setDeleteTarget(null);
      fetchCases();
    } catch {
      toast({ title: ky.retention.deleteError, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = cases.filter((c) => statusFilter === 'all' || c.status === statusFilter);

  const columns: Column<RetentionCase>[] = [
    { key: 'summary', header: ky.retention.summary, render: (c) => (
      <div>
        <span className="font-medium">{c.summary || '—'}</span>
        <p className="text-xs text-muted-foreground">{c.lmsCourseId} • {c.lmsGroupId}</p>
      </div>
    )},
    { key: 'issueType', header: ky.retention.issueType, render: (c) => <span className="text-sm">{ky.issueType[c.issueType]}</span> },
    { key: 'severity', header: ky.retention.severity, render: (c) => <StatusBadge variant={getRiskSeverityVariant(c.severity)} dot>{ky.riskSeverity[c.severity]}</StatusBadge> },
    { key: 'lastActivityAt', header: ky.retention.lastActivity, render: (c) => c.lastActivityAt ? new Date(c.lastActivityAt).toLocaleDateString('ky-KG') : '—', className: 'hidden md:table-cell' },
    { key: 'assignedTo', header: ky.common.manager, render: (c) => c.assignedTo?.fullName || '—', className: 'hidden lg:table-cell' },
    { key: 'status', header: ky.common.status, render: (c) => <StatusBadge variant={caseStatusVariant(c.status)} dot>{caseStatusLabel[c.status]}</StatusBadge> },
    { key: 'actions', header: ky.common.actions, render: (c) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-7 text-xs" title={ky.retention.contactStudent}><Phone className="h-3.5 w-3.5" /></Button>
        {c.status === 'open' && <Button variant="ghost" size="sm" className="h-7 text-xs text-success" title={ky.retention.resolve}><CheckCircle className="h-3.5 w-3.5" /></Button>}
        {(c.status === 'open' || c.status === 'contacted') && <Button variant="ghost" size="sm" className="h-7 text-xs text-warning" title={ky.retention.escalate}><ArrowUpCircle className="h-3.5 w-3.5" /></Button>}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    )},
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
            <p className="font-medium">{retentionCase.lastActivityAt ? new Date(retentionCase.lastActivityAt).toLocaleDateString('ky-KG') : '—'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{retentionCase.assignedTo?.fullName || 'Менеджер жок'}</div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={ky.retention.contactStudent} onClick={(e) => e.stopPropagation()}><Phone className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(retentionCase); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.retention.title} />
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ky.common.all}</SelectItem>
            {Object.entries(caseStatusLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Учур издөө..." renderMobileCard={renderMobileCard} />

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
