import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ky } from '@/lib/i18n';
import { leadsApi, usersApi } from '@/api/modules';
import { useLmsCourses, useLmsGroups } from '@/hooks/use-lms';
import type { AssignableUser, Lead, LeadQualificationStatus, LeadSource } from '@/types';
import { getLeadQualificationStatus } from '@/lib/crm-status';
import { Plus, Filter, Trash2, Loader2, Save, Phone, Mail, User } from 'lucide-react';
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
  const [managers, setManagers] = useState<AssignableUser[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const emptyLeadForm = {
    fullName: '',
    phone: '',
    email: '',
    source: '' as LeadSource | '',
    qualificationStatus: 'new' as LeadQualificationStatus,
    interestedCourseId: '',
    interestedGroupId: '',
    assignedManagerId: '',
    tags: '',
    notes: '',
  };
  const [newLead, setNewLead] = useState(emptyLeadForm);
  const { data: coursesData, isLoading: coursesLoading } = useLmsCourses({ isActive: 'true' });
  const courses = coursesData?.items ?? [];
  const selectedCourse = courses.find((course) => course.id === newLead.interestedCourseId);
  const needsGroup = !!selectedCourse && selectedCourse.courseType !== 'video';
  const { data: groupsData, isLoading: groupsLoading } = useLmsGroups(
    needsGroup ? { courseId: newLead.interestedCourseId, status: 'active' } : undefined
  );
  const groups = groupsData?.items ?? [];

  const fetchLeads = () => {
    setIsLoading(true);
    leadsApi.list({ search, qualificationStatus: statusFilter === 'all' ? undefined : statusFilter })
      .then((res) => setLeads(res.items))
      .catch(() => setLeads(mockLeads))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchLeads(); }, [search, statusFilter]);

  useEffect(() => {
    if (!createOpen) return;
    setManagersLoading(true);
    usersApi.assignables()
      .then(setManagers)
      .catch(() => setManagers([]))
      .finally(() => setManagersLoading(false));
  }, [createOpen]);

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
    if (!newLead.fullName || !newLead.phone) return;
    setIsCreating(true);
    try {
      await leadsApi.create({
        fullName: newLead.fullName,
        phone: newLead.phone,
        email: newLead.email || undefined,
        source: newLead.source || undefined,
        qualificationStatus: newLead.qualificationStatus,
        interestedCourseId: newLead.interestedCourseId || undefined,
        interestedGroupId: newLead.interestedGroupId || undefined,
        assignedManagerId: newLead.assignedManagerId ? Number(newLead.assignedManagerId) : undefined,
        tags: newLead.tags ? newLead.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : undefined,
        notes: newLead.notes || undefined,
      });
      toast({ title: 'Лид ийгиликтүү түзүлдү' });
      setCreateOpen(false);
      setNewLead(emptyLeadForm);
      fetchLeads();
    } catch {
      toast({ title: 'Лид түзүүдө ката кетти', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = leads.filter((l) => {
    const matchSearch = !search || l.fullName.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search) || l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || getLeadQualificationStatus(l) === statusFilter;
    return matchSearch && matchStatus;
  });
  const mobileStatuses = Object.entries(ky.leadQualificationStatus).filter(([value]) => (
    statusFilter === 'all' || value === statusFilter
  ));
  const groupedLeads = Object.fromEntries(
    mobileStatuses.map(([status]) => [status, filtered.filter((lead) => getLeadQualificationStatus(lead) === status)])
  );

  const columns: Column<Lead>[] = [
    { key: 'fullName', header: ky.common.name, render: (l) => <span className="font-medium">{l.fullName}</span> },
    { key: 'phone', header: ky.common.phone },
    { key: 'source', header: ky.leads.source, render: (l) => <span className="text-sm">{ky.leadSource[l.source]}</span> },
    { key: 'interestedCourseId', header: ky.leads.interestedCourse, render: (l) => <span className="text-sm">{l.interestedCourseId || '—'}</span> },
    { key: 'assignedManager', header: ky.leads.assignedManager, render: (l) => <span className="text-sm">{l.assignedManager?.fullName || '—'}</span> },
    { key: 'status', header: ky.common.status, render: (l) => { const status = getLeadQualificationStatus(l); return <StatusBadge variant={getLeadStatusVariant(status)} dot>{ky.leadQualificationStatus[status]}</StatusBadge>; } },
    { key: 'createdAt', header: ky.common.date, render: (l) => <span className="text-sm text-muted-foreground">{new Date(l.createdAt).toLocaleDateString('ky-KG')}</span>, className: 'hidden md:table-cell' },
    {
      key: 'actions', header: '', render: (l) => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(l); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

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
            <SelectTrigger className="w-48">
              <SelectValue placeholder={ky.common.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ky.common.all}</SelectItem>
              {Object.entries(ky.leadQualificationStatus).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        <div className="space-y-3">
          <div className="relative">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Лид издөө..."
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {ky.common.noData}
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory">
            <div className="flex gap-4">
              {mobileStatuses.map(([status, label]) => {
                const items = groupedLeads[status] ?? [];
                return (
                  <div key={status} className="flex h-[calc(100vh-16rem)] w-[calc(100vw-2rem)] shrink-0 snap-center flex-col rounded-3xl border bg-muted/30 p-3">
                    <div className="mb-3 flex shrink-0 items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{label}</p>
                        <StatusBadge variant={getLeadStatusVariant(status)} dot>
                          {items.length}
                        </StatusBadge>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                      {items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed bg-background/70 px-3 py-6 text-center text-xs text-muted-foreground">
                          Бул этапта лид жок
                        </div>
                      ) : (
                        items.map((lead) => (
                          <div
                            key={lead.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                navigate(`/leads/${lead.id}`);
                              }
                            }}
                            className="w-full rounded-2xl border bg-background p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="truncate font-semibold text-foreground">{lead.fullName}</p>
                                <p className="text-xs text-muted-foreground">{ky.leadSource[lead.source]}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(lead);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4 shrink-0" />
                                <span className="truncate">{lead.phone}</span>
                              </div>
                              {lead.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{lead.email}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4 shrink-0" />
                                <span className="truncate">{lead.assignedManager?.fullName || 'Дайындалган эмес'}</span>
                              </div>
                            </div>

                            {(lead.interestedCourseId || (lead.tags?.length ?? 0) > 0) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {lead.interestedCourseId && (
                                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                    {lead.interestedCourseId}
                                  </span>
                                )}
                                {lead.tags?.slice(0, 2).map((tag) => (
                                  <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
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
                <Label>{ky.leads.source}</Label>
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
              <div className="space-y-2">
                <Label>{ky.common.status}</Label>
                <Select value={newLead.qualificationStatus} onValueChange={(v) => setNewLead(p => ({ ...p, qualificationStatus: v as LeadQualificationStatus }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={ky.common.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ky.leadQualificationStatus).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{ky.leads.interestedCourse}</Label>
                <Select value={newLead.interestedCourseId || '__none__'} onValueChange={(value) => setNewLead(p => ({ ...p, interestedCourseId: value === '__none__' ? '' : value, interestedGroupId: '' }))} disabled={coursesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={coursesLoading ? 'Жүктөлүүдө...' : 'Курс тандаңыз'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Тандалган эмес</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Кызыккан топ</Label>
                <Select value={newLead.interestedGroupId || '__none__'} onValueChange={(value) => setNewLead(p => ({ ...p, interestedGroupId: value === '__none__' ? '' : value }))} disabled={!needsGroup || groupsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={!needsGroup ? 'Талап кылынбайт' : groupsLoading ? 'Жүктөлүүдө...' : 'Топ тандаңыз'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{!needsGroup ? 'Талап кылынбайт' : 'Тандалган эмес'}</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{ky.leads.assignedManager}</Label>
                <Select value={newLead.assignedManagerId || '__none__'} onValueChange={(value) => setNewLead(p => ({ ...p, assignedManagerId: value === '__none__' ? '' : value }))} disabled={managersLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={managersLoading ? 'Жүктөлүүдө...' : 'Менеджер тандаңыз'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Тандалган эмес</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={String(manager.id)}>{manager.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{ky.common.tags}</Label>
              <Input value={newLead.tags} onChange={(e) => setNewLead(p => ({ ...p, tags: e.target.value }))} placeholder="IT, Frontend, Ысык лид" />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.notes}</Label>
              <Textarea value={newLead.notes} onChange={(e) => setNewLead(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>{ky.common.cancel}</Button>
              <Button type="submit" disabled={!newLead.fullName || !newLead.phone || isCreating}>
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
