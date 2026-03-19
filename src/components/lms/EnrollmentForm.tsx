import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send } from 'lucide-react';
import { useLmsCourses, useLmsGroups, useCreateEnrollment } from '@/hooks/use-lms';
import { useAuth } from '@/contexts/AuthContext';
import { dealsApi, leadsApi } from '@/api/modules';
import type { Deal, Lead } from '@/types';
import type { CreateEnrollmentRequest, LmsCourseType } from '@/types/lms';

const courseTypeLabels: Record<LmsCourseType, string> = {
  video: 'Видео',
  offline: 'Оффлайн',
  online_live: 'Онлайн түз эфир',
};

const courseTypeBadgeClass: Record<LmsCourseType, string> = {
  video: 'bg-accent text-accent-foreground',
  offline: 'bg-primary/10 text-primary',
  online_live: 'bg-destructive/10 text-destructive',
};

export function EnrollmentForm() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dealId, setDealId] = useState('');
  const [notes, setNotes] = useState('');
  const [groupError, setGroupError] = useState('');
  const idempotencyRef = useRef<{ signature: string; key: string } | null>(null);
  const [submitError, setSubmitError] = useState('');

  const { data: coursesData, isLoading: coursesLoading } = useLmsCourses({ isActive: 'true' });
  const courses = coursesData?.items ?? [];

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId]
  );
  const isVideo = selectedCourse?.courseType === 'video';
  const needsGroup = selectedCourse && !isVideo;

  const { data: groupsData, isLoading: groupsLoading } = useLmsGroups(
    needsGroup ? { courseId, status: 'active' } : undefined
  );
  const groups = groupsData?.items ?? [];
  const selectedLead = useMemo(
    () => leads.find((lead) => String(lead.id) === leadId),
    [leads, leadId]
  );
  const selectedDeal = useMemo(
    () => deals.find((deal) => String(deal.id) === dealId),
    [deals, dealId]
  );

  const createMutation = useCreateEnrollment();

  useEffect(() => {
    setLeadsLoading(true);
    leadsApi.list({ page: 1, limit: 100 })
      .then((res) => setLeads(res.items))
      .catch(() => setLeads([]))
      .finally(() => setLeadsLoading(false));

    setDealsLoading(true);
    dealsApi.list({ page: 1, limit: 100 })
      .then((res) => setDeals(res.items))
      .catch(() => setDeals([]))
      .finally(() => setDealsLoading(false));
  }, []);

  const handleCourseChange = (value: string) => {
    setCourseId(value);
    setGroupId('');
    setGroupError('');
    setSubmitError('');
  };

  const handleLeadChange = (value: string) => {
    const lead = leads.find((item) => String(item.id) === value);
    setLeadId(value);
    setSubmitError('');
    if (!lead) return;
    setStudentName(lead.fullName || '');
    setStudentPhone(lead.phone || '');
    setStudentEmail(lead.email || '');
  };

  const handleDealChange = (value: string) => {
    if (value === '__none__') {
      setDealId('');
      return;
    }
    const deal = deals.find((item) => String(item.id) === value);
    setDealId(value);
    if (!deal) return;
    if (deal.lmsCourseId) {
      setCourseId(deal.lmsCourseId);
    }
    if (deal.lmsGroupId) {
      setGroupId(deal.lmsGroupId);
    } else {
      setGroupId('');
    }
  };

  const canSubmit =
    courseId &&
    (isVideo || groupId) &&
    studentName &&
    studentPhone &&
    leadId &&
    !createMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!courseId) {
      setSubmitError('Курсту тандаңыз');
      return;
    }

    if (!studentName.trim()) {
      setSubmitError('Студенттин атын жазыңыз');
      return;
    }

    if (!studentPhone.trim()) {
      setSubmitError('Телефон номерин жазыңыз');
      return;
    }

    if (!leadId) {
      setSubmitError('CRM лидди тандаңыз');
      return;
    }

    if (needsGroup && !groupId) {
      setGroupError('Топту тандаңыз (группа/когорта)');
      setSubmitError('');
      return;
    }

    setSubmitError('');

    const payload: CreateEnrollmentRequest = {
      crmLeadId: leadId,
      crmDealId: dealId || null,
      student: {
        fullName: studentName,
        phone: studentPhone,
        email: studentEmail || null,
      },
      courseId,
      courseType: selectedCourse?.courseType,
      groupId: isVideo ? null : groupId,
      paymentStatus: 'submitted',
      enrollmentStatus: 'pending_activation',
      sourceSystem: 'crm',
      meta: {
        submittedByUserId: String(user.id),
        submittedByName: user.fullName,
        notes: notes || null,
      },
    };

    const signature = JSON.stringify(payload);
    if (idempotencyRef.current?.signature !== signature) {
      idempotencyRef.current = { signature, key: crypto.randomUUID() };
    }

    createMutation.mutate({ data: payload, idempotencyKey: idempotencyRef.current.key }, {
      onSuccess: () => {
        setCourseId('');
        setGroupId('');
        setStudentName('');
        setStudentPhone('');
        setStudentEmail('');
        setLeadId('');
        setDealId('');
        setNotes('');
        setGroupError('');
        idempotencyRef.current = null;
        setSubmitError('');
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Жаңы каттоо (Enrollment)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course selector */}
          <div className="space-y-2">
            <Label>Курс</Label>
            <Select value={courseId} onValueChange={handleCourseChange} disabled={coursesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={coursesLoading ? 'Жүктөлүүдө...' : 'Курс тандаңыз'} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      {c.name}
                      {c.courseType && (
                        <Badge variant="outline" className={courseTypeBadgeClass[c.courseType]}>
                          {courseTypeLabels[c.courseType]}
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCourse?.courseType && (
              <p className="text-xs text-muted-foreground">
                Түрү: {courseTypeLabels[selectedCourse.courseType]}
                {isVideo && ' — Топ тандоо талап кылынбайт'}
              </p>
            )}
          </div>

          {/* Group selector — hidden for video courses */}
          {needsGroup && (
            <div className="space-y-2">
              <Label>Топ *</Label>
              <Select
                value={groupId}
                onValueChange={(v) => { setGroupId(v); setGroupError(''); }}
                disabled={!courseId || groupsLoading}
              >
                <SelectTrigger className={groupError ? 'border-destructive' : ''}>
                  <SelectValue placeholder={
                    groupsLoading ? 'Жүктөлүүдө...' :
                    groups.length === 0 ? 'Топтор жок' : 'Топ тандаңыз'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="flex flex-col">
                        <span>
                          {g.name} {g.teacherName ? `(${g.teacherName})` : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {g.startDate && `Башталышы: ${g.startDate}`}
                          {g.schedule ? ` — ${g.schedule}` : ''}
                          {g.capacity != null && g.enrolled != null
                            ? ` | ${g.capacity - g.enrolled} орун бош`
                            : ''}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {groupError && <p className="text-xs text-destructive">{groupError}</p>}
            </div>
          )}

          {isVideo && (
            <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              📹 Бул видео курс — өз темпиңизде өтөсүз. Топ тандоо талап кылынбайт.
            </div>
          )}

          {/* Student info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Студент аты *</Label>
              <Input value={studentName} onChange={(e) => { setStudentName(e.target.value); setSubmitError(''); }} />
            </div>
            <div className="space-y-2">
              <Label>Телефон *</Label>
              <Input value={studentPhone} onChange={(e) => { setStudentPhone(e.target.value); setSubmitError(''); }} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CRM Лид *</Label>
              <Select value={leadId} onValueChange={handleLeadChange} disabled={leadsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={leadsLoading ? 'Жүктөлүүдө...' : 'Лид тандаңыз'} />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={String(lead.id)}>
                      {lead.fullName} {lead.phone ? `• ${lead.phone}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Келишим ID (милдеттүү эмес)</Label>
            <Select value={dealId || '__none__'} onValueChange={handleDealChange} disabled={dealsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={dealsLoading ? 'Жүктөлүүдө...' : 'Келишим тандаңыз'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Тандалган эмес</SelectItem>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={String(deal.id)}>
                    #{deal.id} {deal.contact?.fullName ? `• ${deal.contact.fullName}` : ''} {deal.courseNameSnapshot ? `• ${deal.courseNameSnapshot}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDeal && (
              <p className="text-xs text-muted-foreground">
                Курс: {selectedDeal.courseNameSnapshot || selectedDeal.lmsCourseId || '—'}
                {selectedDeal.groupNameSnapshot ? ` • Топ: ${selectedDeal.groupNameSnapshot}` : ''}
              </p>
            )}
          </div>

          {selectedLead && (
            <p className="text-xs text-muted-foreground">
              Тандалган лид: #{selectedLead.id}
              {selectedLead.contactId ? ` • Байланыш #${selectedLead.contactId}` : ''}
            </p>
          )}

          <div className="space-y-2">
            <Label>Эскертүүлөр</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Каттоо жиберүү
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
