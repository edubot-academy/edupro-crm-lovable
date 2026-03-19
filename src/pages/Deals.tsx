import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ky } from '@/lib/i18n';
import { contactApi, dealsApi, tasksApi } from '@/api/modules';
import { useLmsCourses, useLmsGroups } from '@/hooks/use-lms';
import type { Contact, Deal, DealPipelineStage } from '@/types';
import { getDealPipelineStage } from '@/lib/crm-status';
import type { LmsCourseType } from '@/types/lms';
import { formatLmsDate, getCourseSalesSummary, getLmsGroupAvailability, getSeatsLeft } from '@/lib/lms-availability';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const mockDeals: Deal[] = [
  { id: 1, contact: { id: 1, fullName: 'Элнура Турдалиева' }, lmsCourseId: 'c1', courseNameSnapshot: 'Python', lmsGroupId: 'g1', groupNameSnapshot: 'PY-24-1', amount: 15000, currency: 'KGS', stage: 'won', createdAt: '2024-02-20', updatedAt: '2024-03-10' },
  { id: 2, contact: { id: 2, fullName: 'Данияр Абдыраев' }, lmsCourseId: 'c2', courseNameSnapshot: 'Data Science', lmsGroupId: 'g2', groupNameSnapshot: 'DS-24-1', amount: 20000, currency: 'KGS', stage: 'payment_pending', createdAt: '2024-03-01', updatedAt: '2024-03-08' },
];

const emptyForm = {
  contactId: '',
  amount: '',
  currency: 'KGS',
  pipelineStage: 'new' as DealPipelineStage,
  courseType: 'offline' as LmsCourseType,
  courseNameSnapshot: '',
  groupNameSnapshot: '',
  lmsCourseId: '',
  lmsGroupId: '',
  notes: '',
  initialTaskTitle: '',
  initialTaskDescription: '',
  initialTaskDueAt: '',
};

export default function DealsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { data: coursesData, isLoading: coursesLoading } = useLmsCourses({ isActive: 'true' });
  const courses = coursesData?.items ?? [];
  const selectedCourse = courses.find((course) => course.id === form.lmsCourseId);
  const needsGroup = !!selectedCourse && selectedCourse.courseType !== 'video';
  const { data: groupsData, isLoading: groupsLoading } = useLmsGroups(
    needsGroup ? { courseId: form.lmsCourseId } : undefined,
  );
  const groups = groupsData?.items ?? [];
  const selectedGroup = groups.find((group) => group.id === form.lmsGroupId);
  const prefillCourseId = searchParams.get('courseId') || '';
  const prefillGroupId = searchParams.get('groupId') || '';
  const shouldOpenCreate = searchParams.get('create') === '1';

  const clearPrefillParams = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('create');
      next.delete('courseId');
      next.delete('courseType');
      next.delete('groupId');
      return next;
    }, { replace: true });
  };

  const fetchDeals = () => {
    setIsLoading(true);
    dealsApi.list({ search })
      .then((res) => setDeals(res.items))
      .catch(() => setDeals(mockDeals))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchDeals(); }, [search]);

  useEffect(() => {
    if (!showCreate) return;
    setContactsLoading(true);
    contactApi.list({ page: 1, limit: 100 })
      .then((res) => setContacts(res.items))
      .catch(() => setContacts([]))
      .finally(() => setContactsLoading(false));
  }, [showCreate]);

  useEffect(() => {
    if (!shouldOpenCreate) return;
    setShowCreate(true);
  }, [shouldOpenCreate]);

  useEffect(() => {
    if (!showCreate || !courses.length || !prefillCourseId) return;
    const course = courses.find((item) => item.id === prefillCourseId);
    if (!course) return;
    setForm((prev) => {
      if (prev.lmsCourseId === course.id) return prev;
      return {
        ...prev,
        lmsCourseId: course.id,
        courseNameSnapshot: course.name || '',
        courseType: course.courseType || 'offline',
        lmsGroupId: '',
        groupNameSnapshot: '',
      };
    });
  }, [showCreate, courses, prefillCourseId]);

  useEffect(() => {
    if (!showCreate || !prefillGroupId || !groups.length) return;
    const group = groups.find((item) => item.id === prefillGroupId);
    if (!group) return;
    setForm((prev) => ({
      ...prev,
      lmsGroupId: group.id,
      groupNameSnapshot: group.name || '',
    }));
  }, [showCreate, groups, prefillGroupId]);

  const handleContactChange = (value: string) => {
    setForm((prev) => ({ ...prev, contactId: value }));
  };

  const handleCourseChange = (value: string) => {
    const course = courses.find((item) => item.id === value);
    setForm((prev) => ({
      ...prev,
      lmsCourseId: value,
      courseNameSnapshot: course?.name || '',
      courseType: course?.courseType || 'offline',
      lmsGroupId: '',
      groupNameSnapshot: '',
    }));
  };

  const handleGroupChange = (value: string) => {
    const group = groups.find((item) => item.id === value);
    setForm((prev) => ({
      ...prev,
      lmsGroupId: value,
      groupNameSnapshot: group?.name || '',
    }));
  };

  const handleCreate = async () => {
    if (!form.contactId || !form.amount || !form.initialTaskTitle.trim()) return;
    setIsCreating(true);
    try {
      const deal = await dealsApi.create({
        contactId: Number(form.contactId),
        amount: Number(form.amount),
        currency: form.currency,
        pipelineStage: form.pipelineStage,
        courseType: form.courseType,
        courseNameSnapshot: form.courseNameSnapshot || undefined,
        groupNameSnapshot: form.groupNameSnapshot || undefined,
        lmsCourseId: form.lmsCourseId || undefined,
        lmsGroupId: form.lmsGroupId || undefined,
        notes: form.notes || undefined,
      });
      await tasksApi.create({
        title: form.initialTaskTitle.trim(),
        description: form.initialTaskDescription || `Келишим боюнча кийинки кадам: ${form.courseNameSnapshot || 'деталдарды тактоо'}`,
        dueAt: form.initialTaskDueAt || undefined,
        contactId: Number(form.contactId),
        dealId: deal.id,
      });
      toast({ title: 'Келишим ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      clearPrefillParams();
      fetchDeals();
    } catch {
      toast({ title: 'Келишим кошууда ката кетти', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await dealsApi.delete(deleteTarget.id);
      toast({ title: ky.deals.deleteSuccess });
      setDeleteTarget(null);
      fetchDeals();
    } catch {
      toast({ title: ky.deals.deleteError, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Deal>[] = [
    { key: 'contact', header: 'Студент', render: (d) => <span className="font-medium">{d.contact?.fullName || '—'}</span> },
    { key: 'courseNameSnapshot', header: ky.deals.course, render: (d) => d.courseNameSnapshot || '—' },
    { key: 'groupNameSnapshot', header: ky.deals.group, render: (d) => d.groupNameSnapshot || '—' },
    { key: 'amount', header: ky.deals.amount, render: (d) => <span className="font-medium">{d.amount.toLocaleString()} {d.currency || 'сом'}</span> },
    { key: 'stage', header: ky.deals.stage, render: (d) => { const stage = getDealPipelineStage(d); return <StatusBadge variant={getLeadStatusVariant(stage)} dot>{ky.dealPipelineStage[stage]}</StatusBadge>; } },
    {
      key: 'actions', header: '', render: (d) => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(d); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.deals.title} actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.deals.newDeal}</Button>} />
      <DataTable
        columns={columns}
        data={deals}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Келишим издөө..."
        onRowClick={(deal) => navigate(`/deals/${deal.id}`)}
      />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => {
        setShowCreate(open);
        if (!open) clearPrefillParams();
      }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{ky.deals.newDeal}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Байланыш *</Label>
                <Select value={form.contactId} onValueChange={handleContactChange} disabled={contactsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={contactsLoading ? 'Жүктөлүүдө...' : 'Байланыш тандаңыз'} />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={String(contact.id)}>
                        {contact.fullName} {contact.phone ? `• ${contact.phone}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{ky.deals.amount} *</Label>
                <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="15000" type="number" />
              </div>
              <div className="space-y-2">
                <Label>{ky.deals.course}</Label>
                <Select value={form.lmsCourseId} onValueChange={handleCourseChange} disabled={coursesLoading}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCourse && (
                  <p className="text-xs text-muted-foreground">
                    {getCourseSalesSummary(selectedCourse).join(' • ') || 'Маалымат жок'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Курс түрү</Label>
                <Input value={form.courseType === 'online_live' ? 'Онлайн түз эфир' : form.courseType === 'video' ? 'Видео' : 'Оффлайн'} readOnly />
              </div>
              <div className="space-y-2">
                <Label>{ky.deals.group}</Label>
                <Select value={form.lmsGroupId || '__none__'} onValueChange={(value) => handleGroupChange(value === '__none__' ? '' : value)} disabled={!needsGroup || groupsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={!needsGroup ? 'Талап кылынбайт' : groupsLoading ? 'Жүктөлүүдө...' : 'Топ тандаңыз'} />
                  </SelectTrigger>
                  <SelectContent>
                    {!needsGroup && <SelectItem value="__none__">Талап кылынбайт</SelectItem>}
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} {group.teacherName ? `• ${group.teacherName}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedGroup && (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{selectedGroup.name}</span>
                      <Badge variant={getLmsGroupAvailability(selectedGroup).tone}>
                        {getLmsGroupAvailability(selectedGroup).label}
                      </Badge>
                    </div>
                    <p>
                      {selectedGroup.startDate ? `Башталышы: ${formatLmsDate(selectedGroup.startDate)}` : 'Башталышы: такталган эмес'}
                      {selectedGroup.schedule ? ` • График: ${selectedGroup.schedule}` : ''}
                    </p>
                    <p>
                      {selectedGroup.teacherName ? `Мугалим: ${selectedGroup.teacherName}` : 'Мугалим: дайындала элек'}
                      {selectedGroup.capacity != null ? ` • Орун: ${selectedGroup.currentStudentCount ?? 0}/${selectedGroup.capacity}` : ''}
                      {getSeatsLeft(selectedGroup) != null ? ` • Бош орун: ${getSeatsLeft(selectedGroup)}` : ''}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>LMS Курс ID</Label>
                <Input value={form.lmsCourseId} readOnly placeholder="Авто" />
              </div>
              <div className="space-y-2">
                <Label>LMS Топ ID</Label>
                <Input value={form.lmsGroupId || '—'} readOnly placeholder="Авто" />
              </div>
              <div className="space-y-2">
                <Label>{ky.deals.currency}</Label>
                <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="KGS" />
              </div>
              <div className="space-y-2">
                <Label>{ky.deals.stage}</Label>
                <Select value={form.pipelineStage} onValueChange={(v) => setForm({ ...form, pipelineStage: v as DealPipelineStage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ky.dealPipelineStage).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{ky.common.notes}</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Контекст же комментарий" />
            </div>
            <div className="space-y-4 rounded-lg border border-border/60 p-4">
              <div>
                <p className="text-sm font-medium">Биринчи тапшырма</p>
                <p className="text-xs text-muted-foreground">Ар бир жаңы келишим үчүн кийинки аракет дароо пландалат.</p>
              </div>
              <div className="space-y-2">
                <Label>Тапшырма аталышы *</Label>
                <Input value={form.initialTaskTitle} onChange={(e) => setForm({ ...form, initialTaskTitle: e.target.value })} placeholder="Студентке чалуу" />
              </div>
              <div className="space-y-2">
                <Label>{ky.tasks.description}</Label>
                <Input value={form.initialTaskDescription} onChange={(e) => setForm({ ...form, initialTaskDescription: e.target.value })} placeholder="Эмне кылуу керек?" />
              </div>
              <div className="space-y-2">
                <Label>{ky.tasks.dueAt}</Label>
                <Input type="datetime-local" value={form.initialTaskDueAt} onChange={(e) => setForm({ ...form, initialTaskDueAt: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || !form.contactId || !form.amount || !form.initialTaskTitle.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ky.deals.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{ky.deals.deleteConfirmDesc}</AlertDialogDescription>
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
