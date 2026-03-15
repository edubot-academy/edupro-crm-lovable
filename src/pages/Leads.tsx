import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { KanbanBoard, type KanbanColumn } from '@/components/KanbanBoard';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ky } from '@/lib/i18n';
import { leadsApi } from '@/api/modules';
import type { Lead, LeadSource } from '@/types';
import { Plus, Filter, Trash2, Loader2, Save, Phone, Mail, UserRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mockLeads: Lead[] = [
  { id: 1, fullName: 'Азамат Токтогулов', phone: '+996 555 123456', email: 'azamat@mail.kg', source: 'instagram', interestedCourseId: 'c1', assignedManager: { id: 1, fullName: 'Нургуль' }, status: 'new', notes: '', tags: ['IT'], createdAt: '2024-03-01', updatedAt: '2024-03-01' },
  { id: 2, fullName: 'Айгерим Сатыбалдиева', phone: '+996 700 234567', email: 'aigerim@mail.kg', source: 'telegram', interestedCourseId: 'c2', assignedManager: { id: 2, fullName: 'Айбек' }, status: 'contacted', notes: '', tags: ['IT'], createdAt: '2024-03-02', updatedAt: '2024-03-02' },
  { id: 3, fullName: 'Бакыт Жумалиев', phone: '+996 770 345678', email: 'bakyt@mail.kg', source: 'whatsapp', interestedCourseId: 'c3', assignedManager: { id: 3, fullName: 'Эрлан' }, status: 'trial_scheduled', notes: '', tags: ['Дизайн'], createdAt: '2024-03-03', updatedAt: '2024-03-03' },
  { id: 4, fullName: 'Гүлнара Касымова', phone: '+996 550 456789', email: 'gulnara@mail.kg', source: 'website', interestedCourseId: 'c4', assignedManager: { id: 4, fullName: 'Жылдыз' }, status: 'interested', notes: '', tags: ['Тил'], createdAt: '2024-03-04', updatedAt: '2024-03-04' },
  { id: 5, fullName: 'Данияр Абдыраев', phone: '+996 502 567890', email: 'daniyar@mail.kg', source: 'referral', interestedCourseId: 'c5', assignedManager: { id: 1, fullName: 'Нургуль' }, status: 'offer_sent', notes: '', tags: ['IT'], createdAt: '2024-03-05', updatedAt: '2024-03-05' },
  { id: 6, fullName: 'Элнура Турдалиева', phone: '+996 558 678901', email: 'elnura@mail.kg', source: 'phone_call', interestedCourseId: 'c1', assignedManager: { id: 2, fullName: 'Айбек' }, status: 'won', notes: '', tags: ['IT'], createdAt: '2024-03-06', updatedAt: '2024-03-06' },
  { id: 7, fullName: 'Жаныл Бекова', phone: '+996 703 789012', email: 'janyl@mail.kg', source: 'instagram', interestedCourseId: 'c2', assignedManager: { id: 3, fullName: 'Эрлан' }, status: 'payment_pending', notes: '', tags: ['IT'], createdAt: '2024-03-07', updatedAt: '2024-03-07' },
  { id: 8, fullName: 'Кайрат Орозбеков', phone: '+996 771 890123', email: 'kairat@mail.kg', source: 'telegram', interestedCourseId: 'c3', assignedManager: { id: 4, fullName: 'Жылдыз' }, status: 'lost', notes: 'Бааны кымбат деп тапты', tags: ['Дизайн'], createdAt: '2024-03-08', updatedAt: '2024-03-08' },
];

export default function LeadsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLead, setNewLead] = useState({ fullName: '', phone: '', email: '', source: '' as LeadSource | '', notes: '' });
  const [activeColumn, setActiveColumn] = useState<string>('new');

  const fetchLeads = () => {
    setIsLoading(true);
    leadsApi.list({ search, status: statusFilter === 'all' ? undefined : statusFilter })
      .then((res) => setLeads(res.items))
      .catch(() => setLeads(mockLeads))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchLeads(); }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await leadsApi.delete(deleteTarget.id);
      toast({ title: ky.leads.deleteSuccess });
      setDeleteTarget(null);
      fetchLeads();
    } catch {
      toast({ title: ky.leads.deleteError, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.fullName || !newLead.phone || !newLead.source) return;
    setIsCreating(true);
    try {
      await leadsApi.create({ fullName: newLead.fullName, phone: newLead.phone, email: newLead.email, source: newLead.source as LeadSource, status: 'new', notes: newLead.notes });
      toast({ title: 'Лид ийгиликтүү түзүлдү' });
      setCreateOpen(false);
      setNewLead({ fullName: '', phone: '', email: '', source: '', notes: '' });
      fetchLeads();
    } catch {
      toast({ title: 'Лид түзүүдө ката кетти', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = leads.filter((l) => {
    const matchSearch = !search || l.fullName.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search) || l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<Lead>[] = [
    { key: 'fullName', header: ky.common.name, render: (l) => <span className="font-medium">{l.fullName}</span> },
    { key: 'phone', header: ky.common.phone },
    { key: 'source', header: ky.leads.source, render: (l) => <span className="text-sm">{ky.leadSource[l.source]}</span> },
    { key: 'interestedCourseId', header: ky.leads.interestedCourse, render: (l) => <span className="text-sm">{l.interestedCourseId || '—'}</span> },
    { key: 'assignedManager', header: ky.leads.assignedManager, render: (l) => <span className="text-sm">{l.assignedManager?.fullName || '—'}</span> },
    { key: 'status', header: ky.common.status, render: (l) => <StatusBadge variant={getLeadStatusVariant(l.status)} dot>{ky.leadStatus[l.status]}</StatusBadge> },
    { key: 'createdAt', header: ky.common.date, render: (l) => <span className="text-sm text-muted-foreground">{new Date(l.createdAt).toLocaleDateString('ky-KG')}</span>, className: 'hidden md:table-cell' },
    {
      key: 'actions', header: '', render: (l) => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(l); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const mobileColumns: KanbanColumn<Lead>[] = Object.entries(ky.leadStatus).map(([status, label]) => ({
    id: status,
    title: label,
    items: filtered.filter((lead) => lead.status === status),
  }));

  const renderLeadCard = (lead: Lead) => (
    <Card className="shadow-soft border-border/50 hover:shadow-medium transition-shadow">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{lead.fullName}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{ky.leadSource[lead.source]}</span>
              {lead.interestedCourseId && <span>• {lead.interestedCourseId}</span>}
            </div>
          </div>
          <StatusBadge variant={getLeadStatusVariant(lead.status)} dot>
            {ky.leadStatus[lead.status]}
          </StatusBadge>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <UserRound className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{lead.assignedManager?.fullName || '—'}</span>
          </div>
        </div>

        {lead.notes && (
          <p className="line-clamp-2 rounded-md bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">
            {lead.notes}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {new Date(lead.createdAt).toLocaleDateString('ky-KG')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(lead);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={ky.leads.title}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {ky.leads.newLead}
          </Button>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={ky.common.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ky.common.all}</SelectItem>
              {Object.entries(ky.leadStatus).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="md:hidden">
        <div className="mb-3">
          <div className="relative max-w-sm">
            <Input
              placeholder="Лид издөө..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <Filter className="h-4 w-4" />
            </span>
          </div>
        </div>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center rounded-lg border bg-card shadow-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <KanbanBoard
            columns={mobileColumns}
            renderCard={renderLeadCard}
            activeColumn={activeColumn}
            onColumnChange={setActiveColumn}
            onCardClick={(lead) => navigate(`/leads/${lead.id}`)}
          />
        )}
      </div>

      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Лид издөө..."
          onRowClick={(lead) => navigate(`/leads/${lead.id}`)}
        />
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ky.leads.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{ky.leads.deleteConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{ky.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {ky.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{ky.leads.newLead}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{ky.common.name} *</Label>
                <Input value={newLead.fullName} onChange={(e) => setNewLead(p => ({ ...p, fullName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>{ky.common.phone} *</Label>
                <Input value={newLead.phone} onChange={(e) => setNewLead(p => ({ ...p, phone: e.target.value }))} required placeholder="+996 ..." />
              </div>
              <div className="space-y-2">
                <Label>{ky.common.email}</Label>
                <Input type="email" value={newLead.email} onChange={(e) => setNewLead(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{ky.leads.source} *</Label>
                <Select value={newLead.source} onValueChange={(v) => setNewLead(p => ({ ...p, source: v as LeadSource }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Булак тандаңыз" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ky.leadSource).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{ky.common.notes}</Label>
              <Textarea value={newLead.notes} onChange={(e) => setNewLead(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>{ky.common.cancel}</Button>
              <Button type="submit" disabled={!newLead.fullName || !newLead.phone || !newLead.source || isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {ky.common.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
