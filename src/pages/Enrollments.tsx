import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { EnrollmentForm } from '@/components/lms/EnrollmentForm';
import { IntegrationHistoryPanel } from '@/components/lms/IntegrationHistoryPanel';
import { StudentSummaryPanel } from '@/components/lms/StudentSummaryPanel';
import { DataTable, type Column } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLmsCourses, useLmsGroups } from '@/hooks/use-lms';
import { useApproveEnrollment, useEnrollmentHistory, usePendingEnrollments } from '@/hooks/use-enrollments';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';
import { Calendar, CheckCircle, Clock, Copy, Loader2, Mail, Phone, RefreshCw, FileText } from 'lucide-react';

interface PendingEnrollment {
  enrollmentId: string;
  crmLeadId: string;
  courseId: string;
  courseType: string;
  groupId?: string;
  student: {
    fullName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  requestId: string;
}

interface EnrollmentHistoryItem {
  id: string;
  type: string;
  direction: string;
  createdAt: string;
  enrollmentId: string;
  crmLeadId: string;
  courseId: string;
  courseType: string;
  status: string;
  endpoint: string;
  method: string;
  message: string;
  student?: {
    fullName?: string;
    email?: string;
  };
}

export default function EnrollmentsPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedEnrollment, setSelectedEnrollment] = useState<PendingEnrollment | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<EnrollmentHistoryItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending' | 'error'>('all');
  const [historyPage, setHistoryPage] = useState(0);
  const initialStudentId = searchParams.get('studentId') || undefined;
  const initialHistoryFilters = {
    crmContactId: searchParams.get('crmContactId') || undefined,
    lmsStudentId: searchParams.get('studentId') || undefined,
    lmsEnrollmentId: searchParams.get('enrollmentId') || undefined,
  };
  const isApprovalAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const coursesQuery = useLmsCourses();
  const groupsQuery = useLmsGroups();
  const pendingQuery = usePendingEnrollments(isApprovalAdmin);
  const historyQuery = useEnrollmentHistory({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 20,
    offset: historyPage * 20,
  }, isApprovalAdmin && activeTab === 'history');
  const approveMutation = useApproveEnrollment();
  const courses = coursesQuery.data?.items ?? [];
  const groups = groupsQuery.data?.items ?? [];
  const pendingEnrollments = pendingQuery.data?.pending ?? [];
  const historyItems = historyQuery.data?.enrollments ?? [];
  const pendingLoading = pendingQuery.isLoading || pendingQuery.isFetching;
  const historyLoading = historyQuery.isLoading || historyQuery.isFetching;
  const historyTotal = historyQuery.data?.total ?? 0;

  useEffect(() => {
    if (pendingQuery.error) {
      const friendly = getFriendlyError(pendingQuery.error, { fallbackTitle: 'Күтүүдөгү каттоолор жүктөлгөн жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    }
  }, [pendingQuery.error, toast]);

  useEffect(() => {
    if (historyQuery.error) {
      const friendly = getFriendlyError(historyQuery.error, { fallbackTitle: 'Каттоо тарыхы жүктөлгөн жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    }
  }, [historyQuery.error, toast]);

  const handleApprove = async () => {
    if (!selectedEnrollment) return;

    try {
      await approveMutation.mutateAsync({
        id: Number(selectedEnrollment.enrollmentId),
        notes: approvalNotes || undefined,
      });

      toast({
        title: 'Каттоо бекитилди',
        description: 'LMS каттоосу активдештирилди.',
      });

      setApproveDialogOpen(false);
      setSelectedEnrollment(null);
      setApprovalNotes('');
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Каттоону бекитүү мүмкүн болгон жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    }
  };

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: 'ID көчүрүлдү' });
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((item) => item.id === courseId);
    return course?.name || courseId;
  };

  const getGroupName = (groupId?: string) => {
    if (!groupId) return 'Топ жок';
    const group = groups.find((item) => item.id === groupId);
    return group?.name || groupId;
  };

  const renderStatusBadge = (status: string) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      success: 'default',
      activated: 'default',
      approved: 'default',
      pending: 'secondary',
      pending_approval: 'secondary',
      error: 'destructive',
      failed: 'destructive',
    };

    const labelMap: Record<string, string> = {
      success: 'Ийгиликтүү',
      activated: 'Активдүү',
      approved: 'Бекитилди',
      pending: 'Күтүүдө',
      pending_approval: 'Бекитүүнү күтөт',
      error: 'Ката',
      failed: 'Ишке ашкан жок',
    };

    return <Badge variant={variantMap[status] || 'secondary'}>{labelMap[status] || status}</Badge>;
  };

  const pendingData = useMemo(
    () => pendingEnrollments.map((item) => ({ ...item, id: item.enrollmentId })),
    [pendingEnrollments],
  );

  const historyData = useMemo(
    () => historyItems.map((item) => ({ ...item, id: item.id })),
    [historyItems],
  );

  const pendingColumns: Column<PendingEnrollment & { id: string }>[] = [
    {
      key: 'student',
      header: 'Студент',
      render: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.student.fullName}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{row.student.email || 'Email жок'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{row.student.phone || 'Телефон жок'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Курс',
      render: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{getCourseName(row.courseId)}</div>
          <div className="text-sm text-muted-foreground">
            Тип: {row.courseType === 'video' ? 'Видео' : row.courseType === 'offline' ? 'Офлайн' : 'Онлайн түз эфир'}
          </div>
          <div className="text-sm text-muted-foreground">Топ: {getGroupName(row.groupId)}</div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Түзүлгөн убакыт',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span>{new Date(row.createdAt).toLocaleString('ky-KG')}</span>
        </div>
      ),
    },
    {
      key: 'enrollmentId',
      header: 'Enrollment ID',
      render: (row) => (
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 text-xs">{row.enrollmentId}</code>
          <Button variant="ghost" size="sm" onClick={() => void copyToClipboard(row.enrollmentId)}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          size="sm"
          onClick={() => {
            setSelectedEnrollment(row);
            setApprovalNotes('');
            setApproveDialogOpen(true);
          }}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Бекитүү
        </Button>
      ),
    },
  ];

  const historyColumns: Column<EnrollmentHistoryItem & { id: string }>[] = [
    {
      key: 'createdAt',
      header: 'Дата',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span>{new Date(row.createdAt).toLocaleString('ky-KG')}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Багыты',
      render: (row) => <Badge variant={row.type === 'outbound' ? 'default' : 'secondary'}>{row.type === 'outbound' ? 'CRM -> LMS' : 'LMS -> CRM'}</Badge>,
    },
    {
      key: 'student',
      header: 'Студент',
      render: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.student?.fullName || 'Белгисиз студент'}</div>
          <div className="text-sm text-muted-foreground">{row.student?.email || 'Email жок'}</div>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Курс',
      render: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.courseId ? getCourseName(row.courseId) : 'Көрсөтүлгөн эмес'}</div>
          <div className="text-sm text-muted-foreground">
            {row.courseType === 'video' ? 'Видео' : row.courseType === 'offline' ? 'Офлайн' : row.courseType === 'online_live' ? 'Онлайн түз эфир' : 'Белгисиз'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      render: (row) => renderStatusBadge(row.status),
    },
    {
      key: 'message',
      header: 'Билдирүү',
      render: (row) => (
        <div className="max-w-xs truncate text-sm" title={row.message}>
          {row.message || 'Маалымат жок'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedHistoryItem(row);
            setHistoryDetailOpen(true);
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          Толук
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="LMS Каттоо" description="Курсларга студенттерди каттоо жана башкаруу" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnrollmentForm />
        <StudentSummaryPanel initialStudentId={initialStudentId} />
      </div>
      {isApprovalAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Түз LMS каттоолорун бекитүү</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending">
                  Бекитүүнү күткөндөр
                  {pendingEnrollments.length > 0 ? <Badge className="ml-2" variant="secondary">{pendingEnrollments.length}</Badge> : null}
                </TabsTrigger>
                <TabsTrigger value="history">Тарых</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => void pendingQuery.refetch()} disabled={pendingLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${pendingLoading ? 'animate-spin' : ''}`} />
                    Жаңылоо
                  </Button>
                </div>
                {pendingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : pendingData.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Clock className="mx-auto mb-3 h-10 w-10 opacity-50" />
                    <p>Бекитүүнү күткөн түз каттоолор жок.</p>
                  </div>
                ) : (
                  <DataTable columns={pendingColumns} data={pendingData} />
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => { setHistoryPage(0); setStatusFilter('all'); }}>
                      Баары
                    </Button>
                    <Button variant={statusFilter === 'success' ? 'default' : 'outline'} size="sm" onClick={() => { setHistoryPage(0); setStatusFilter('success'); }}>
                      Ийгиликтүү
                    </Button>
                    <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => { setHistoryPage(0); setStatusFilter('pending'); }}>
                      Күтүүдө
                    </Button>
                    <Button variant={statusFilter === 'error' ? 'default' : 'outline'} size="sm" onClick={() => { setHistoryPage(0); setStatusFilter('error'); }}>
                      Ката
                    </Button>
                  </div>
                  <Button variant="outline" onClick={() => void historyQuery.refetch()} disabled={historyLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
                    Жаңылоо
                  </Button>
                </div>
                <DataTable
                  columns={historyColumns}
                  data={historyData}
                  isLoading={historyLoading}
                  emptyMessage="Каттоо тарыхы табылган жок"
                  onRowClick={(row) => {
                    setSelectedHistoryItem(row);
                    setHistoryDetailOpen(true);
                  }}
                />
                {historyTotal > 20 ? (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {historyPage * 20 + 1} - {Math.min((historyPage + 1) * 20, historyTotal)} / {historyTotal}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setHistoryPage((current) => Math.max(0, current - 1))} disabled={historyPage === 0}>
                        Артка
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setHistoryPage((current) => current + 1)} disabled={(historyPage + 1) * 20 >= historyTotal}>
                        Алга
                      </Button>
                    </div>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : null}
      <IntegrationHistoryPanel initialFilters={initialHistoryFilters} />

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Түз каттоону бекитүү</DialogTitle>
          </DialogHeader>
          {selectedEnrollment ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Студент</Label>
                  <p className="font-medium">{selectedEnrollment.student.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedEnrollment.student.email || 'Email жок'}</p>
                </div>
                <div>
                  <Label>Курс</Label>
                  <p className="font-medium">{getCourseName(selectedEnrollment.courseId)}</p>
                  <p className="text-sm text-muted-foreground">Топ: {getGroupName(selectedEnrollment.groupId)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-notes">Эскертүү</Label>
                <Textarea
                  id="approval-notes"
                  value={approvalNotes}
                  onChange={(event) => setApprovalNotes(event.target.value)}
                  placeholder="Кааласаңыз бекитүү тууралуу белги калтырыңыз"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                  Жабуу
                </Button>
                <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                  {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Бекитүү жана активдештирүү
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={historyDetailOpen} onOpenChange={setHistoryDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Каттоо тарыхынын деталдары</DialogTitle>
          </DialogHeader>
          {selectedHistoryItem ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Студент</Label>
                  <p className="font-medium">{selectedHistoryItem.student?.fullName || 'Белгисиз студент'}</p>
                  <p className="text-sm text-muted-foreground">{selectedHistoryItem.student?.email || 'Email жок'}</p>
                </div>
                <div className="space-y-1">
                  <Label>Статус</Label>
                  <div>{renderStatusBadge(selectedHistoryItem.status)}</div>
                  <p className="text-sm text-muted-foreground">{new Date(selectedHistoryItem.createdAt).toLocaleString('ky-KG')}</p>
                </div>
                <div className="space-y-1">
                  <Label>Курс</Label>
                  <p className="font-medium">{selectedHistoryItem.courseId ? getCourseName(selectedHistoryItem.courseId) : 'Көрсөтүлгөн эмес'}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedHistoryItem.courseType === 'video' ? 'Видео' : selectedHistoryItem.courseType === 'offline' ? 'Офлайн' : selectedHistoryItem.courseType === 'online_live' ? 'Онлайн түз эфир' : 'Белгисиз'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>CRM байланышы</Label>
                  <p className="font-medium">Lead ID: {selectedHistoryItem.crmLeadId || '—'}</p>
                  <p className="text-sm text-muted-foreground">Enrollment ID: {selectedHistoryItem.enrollmentId || '—'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Техникалык контекст</Label>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground space-y-1">
                  <p>Багыты: {selectedHistoryItem.type === 'outbound' ? 'CRM -> LMS' : 'LMS -> CRM'}</p>
                  <p>HTTP: {selectedHistoryItem.method || '—'} {selectedHistoryItem.endpoint || ''}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Билдирүү</Label>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  {selectedHistoryItem.message || 'Маалымат жок'}
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setHistoryDetailOpen(false)}>
                  Жабуу
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
