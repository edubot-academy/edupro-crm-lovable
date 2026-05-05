import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge, getRiskSeverityVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ky } from '@/lib/i18n';
import { formatDate } from '@/lib/formatting';
import type { AssignableUser, RetentionCase } from '@/types';
import { retentionApi, usersApi } from '@/api/modules';
import { Phone, ArrowUpCircle, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';
import { useRolePermissions } from '@/hooks/use-role-permissions';

const pageSize = 20;
const caseStatusVariant = (s: string) => {
  switch (s) { case 'open': return 'destructive' as const; case 'contacted': return 'warning' as const; case 'monitoring': return 'info' as const; case 'resolved': return 'success' as const; case 'escalated': return 'info' as const; default: return 'default' as const; }
};
const caseStatusLabel: Record<string, string> = { open: 'Ачык', contacted: 'Байланышылды', monitoring: 'Көзөмөлдө', resolved: 'Чечилди', escalated: 'Жогорулатылды' };
const emptyEditForm = { summary: '', issueType: '', severity: '', status: '', assignedToId: '' };

export default function RetentionPage() {
  const { toast } = useToast();
  const { canManageRetentionCases } = useRolePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<RetentionCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<RetentionCase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<RetentionCase | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const search = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const page = Math.max(1, Number(searchParams.get('page') || '1'));

  const setQueryParam = useCallback((key: string, value?: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value && value.trim()) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== 'page') {
        next.set('page', '1');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const fetchCases = useCallback(() => {
    setIsLoading(true);
    retentionApi.list({
      page,
      limit: pageSize,
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    })
      .then((res) => {
        setCases(res.items);
        setTotalItems(res.total || 0);
      })
      .catch(() => {
        setCases([]);
        setTotalItems(0);
      })
      .finally(() => setIsLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  useEffect(() => {
    if (!editTarget) {
      setEditForm(emptyEditForm);
      return;
    }
    setEditForm({
      summary: editTarget.summary || '',
      issueType: editTarget.issueType,
      severity: editTarget.severity,
      status: editTarget.status,
      assignedToId: editTarget.assignedToId ? String(editTarget.assignedToId) : '',
    });
  }, [editTarget]);

  useEffect(() => {
    if (!editTarget) return;
    let cancelled = false;
    setOptionsLoading(true);
    usersApi.assignables()
      .then((users) => {
        if (!cancelled) setAssignableUsers(users);
      })
      .catch(() => {
        if (!cancelled) setAssignableUsers([]);
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editTarget]);

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

  const handleSave = async () => {
    if (!editTarget) return;
    setIsSaving(true);
    try {
      await retentionApi.update(editTarget.id, {
        summary: editForm.summary.trim() || undefined,
        issueType: editForm.issueType as RetentionCase['issueType'],
        severity: editForm.severity as RetentionCase['severity'],
        status: editForm.status as RetentionCase['status'],
        assignedToId: editForm.assignedToId ? Number(editForm.assignedToId) : null,
      });
      toast({ title: 'Учур ийгиликтүү жаңыртылды' });
      setEditTarget(null);
      fetchCases();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Учурду жаңыртуу ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const mobileBoardColumns = Object.entries(caseStatusLabel)
    .filter(([value]) => statusFilter === 'all' || value === statusFilter)
    .map(([value, label]) => ({ id: value, title: label }));
  const activeFilters = [
    ...(search.trim()
      ? [{
        key: 'search',
        label: `Издөө: ${search.trim()}`,
        onRemove: () => setQueryParam('q'),
      }]
      : []),
    ...(statusFilter !== 'all'
      ? [{
        key: 'status',
        label: `Статус: ${caseStatusLabel[statusFilter]}`,
        onRemove: () => setQueryParam('status'),
      }]
      : []),
  ];
  const headerActions = (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус</p>
        <Select value={statusFilter} onValueChange={(value) => setQueryParam('status', value === 'all' ? '' : value)}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бардык статус</SelectItem>
            {Object.entries(caseStatusLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const columns: Column<RetentionCase>[] = [
    {
      key: 'summary', header: ky.retention.summary, render: (c) => (
        <div>
          <span className="font-medium">{c.summary || '—'}</span>
          {c.contact ? <p className="text-xs text-muted-foreground">{c.contact.fullName}</p> : null}
        </div>
      )
    },
    { key: 'issueType', header: ky.retention.issueType, render: (c) => <span className="text-sm">{ky.issueType[c.issueType]}</span> },
    { key: 'severity', header: ky.retention.severity, render: (c) => <StatusBadge variant={getRiskSeverityVariant(c.severity)} dot>{ky.riskSeverity[c.severity]}</StatusBadge> },
    { key: 'lastActivityAt', header: ky.retention.lastActivity, render: (c) => c.lastActivityAt ? formatDate(c.lastActivityAt) : '—', className: 'hidden md:table-cell' },
    {
      key: 'assignedTo',
      header: ky.common.manager,
      render: (c) => (
        <div>
          <div>{c.assignedTo?.fullName || '—'}</div>
          {c.deal ? <div className="text-xs text-muted-foreground">Келишим #{c.deal.id}</div> : null}
        </div>
      ),
      className: 'hidden lg:table-cell'
    },
    { key: 'status', header: ky.common.status, render: (c) => <StatusBadge variant={caseStatusVariant(c.status)} dot>{caseStatusLabel[c.status]}</StatusBadge> },
    {
      key: 'actions', header: ky.common.actions, render: (c) => (
        <div className="flex items-center gap-1">
          {canManageRetentionCases() ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditTarget(c)}>
              {ky.common.edit}
            </Button>
          ) : null}
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
            {retentionCase.contact ? <p className="mt-1 text-xs text-muted-foreground">{retentionCase.contact.fullName}</p> : null}
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
            {canManageRetentionCases() ? (
              <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={(e) => { e.stopPropagation(); setEditTarget(retentionCase); }}>
                {ky.common.edit}
              </Button>
            ) : null}
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
        data={cases}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={(value) => setQueryParam('q', value)}
        searchPlaceholder="Учур издөө..."
        page={page}
        totalPages={Math.max(1, Math.ceil(totalItems / pageSize))}
        onPageChange={(nextPage) => setQueryParam('page', String(nextPage))}
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

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ky.common.edit}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{ky.retention.summary}</Label>
              <Input value={editForm.summary} onChange={(e) => setEditForm((prev) => ({ ...prev, summary: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{ky.retention.issueType}</Label>
                <Select value={editForm.issueType} onValueChange={(value) => setEditForm((prev) => ({ ...prev, issueType: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ky.issueType).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{ky.retention.severity}</Label>
                <Select value={editForm.severity} onValueChange={(value) => setEditForm((prev) => ({ ...prev, severity: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ky.riskSeverity).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{ky.common.status}</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(caseStatusLabel).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{ky.common.manager}</Label>
                <Select value={editForm.assignedToId || '__none__'} onValueChange={(value) => setEditForm((prev) => ({ ...prev, assignedToId: value === '__none__' ? '' : value }))} disabled={optionsLoading}>
                  <SelectTrigger><SelectValue placeholder={optionsLoading ? ky.common.loading : ky.common.notAssigned} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{ky.common.notAssigned}</SelectItem>
                    {assignableUsers.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>{user.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>{ky.common.cancel}</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
