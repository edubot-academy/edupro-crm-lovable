import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ky } from '@/lib/i18n';
import { ArrowLeft, Phone, Mail, User, Loader2, ArrowRightLeft, Save, Tag, CalendarClock, UserCog, ClipboardList } from 'lucide-react';
import { legacyContactsApi, leadsApi, usersApi } from '@/api/modules';
import type { AssignableUser, Contact } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';

type LegacyContactDetail = Contact & {
  status?: string | null;
  source?: string | null;
  sourceProvider?: string | null;
  assignedToName?: string | null;
  createdByName?: string | null;
  updatedByName?: string | null;
  courseName?: string | null;
  courseType?: string | null;
  nextFollowUpAt?: string | null;
  priority?: number | null;
  tags?: string[] | null;
  contactAttempts?: number | null;
  lastAttemptAt?: string | null;
  lastContactedAt?: string | null;
  outcome?: string | null;
  outcomeDetail?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  message?: string | null;
};

const sourceLabels: Record<string, string> = {
  WEBSITE: 'Веб-сайт',
  MANUAL: 'Кол менен',
  SOCIAL: 'Соц тармак',
  ADS: 'Жарнама',
  REFERRAL: 'Сунуштоо',
  CALL: 'Чалуу',
  IMPORT: 'Импорт',
  OTHER: 'Башка',
};

const statusLabels: Record<string, string> = {
  NEW: 'Жаңы',
  CONTACTED: 'Байланышылды',
  RESPONDED: 'Жооп берди',
  QUALIFIED: 'Тандалды',
  UNQUALIFIED: 'Туура келбеди',
  FOLLOW_UP: 'Кайра байланыш',
  NO_RESPONSE: 'Жооп жок',
  PENDING_PAYMENT: 'Төлөм күтүлүүдө',
  ENROLLED: 'Катталды',
  DEFERRED: 'Кийинчерээк',
  LOST: 'Жоголду',
  DUPLICATE: 'Дубликат',
  TEST: 'Тест',
  ARCHIVED: 'Архив',
};

const courseTypeLabels: Record<string, string> = {
  video: 'Видео',
  offline: 'Оффлайн',
  online_live: 'Онлайн',
  campus: 'Кампус',
  online: 'Онлайн',
  hybrid: 'Гибрид',
};

const outcomeLabels: Record<string, string> = {
  INFO_PROVIDED: 'Маалымат берилди',
  NOT_INTERESTED: 'Кызыккан жок',
  NOT_A_FIT: 'Туура келген жок',
  CHOSE_COMPETITOR: 'Атаандашты тандады',
  INVALID_CONTACT: 'Байланыш маалыматы туура эмес',
  DO_NOT_CONTACT: 'Кайра байланышпа',
  CALLBACK_LATER: 'Кийин кайра чалуу',
};

export default function LegacyContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contact, setContact] = useState<LegacyContactDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assignables, setAssignables] = useState<AssignableUser[]>([]);
  const [isAssignablesLoading, setIsAssignablesLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    status: '',
    assigneeUserId: '',
    notes: '',
    priority: '',
    tags: '',
    courseName: '',
    courseType: '',
    nextFollowUpAt: '',
    lastContactedAt: '',
    outcome: '',
    outcomeDetail: '',
  });

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    legacyContactsApi.get(Number(id))
      .then(setContact)
      .catch(() => setError('Байланыш табылган жок'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!contact) return;
    setForm({
      fullName: contact.fullName,
      status: contact.status || '',
      assigneeUserId: contact.assignedToUserId != null ? String(contact.assignedToUserId) : '',
      notes: contact.notes || '',
      priority: contact.priority != null ? String(contact.priority) : '',
      tags: contact.tags?.join(', ') || '',
      courseName: contact.courseName || '',
      courseType: contact.courseType || '',
      nextFollowUpAt: toDateTimeLocal(contact.nextFollowUpAt),
      lastContactedAt: toDateTimeLocal(contact.lastContactedAt),
      outcome: contact.outcome || '',
      outcomeDetail: contact.outcomeDetail || '',
    });
  }, [contact]);

  useEffect(() => {
    if (!isEditOpen) return;

    setIsAssignablesLoading(true);
    usersApi.assignables()
      .then(setAssignables)
      .catch((error) => {
        const friendly = getFriendlyError(error, { fallbackTitle: 'Дайындала турган колдонуучулар жүктөлгөн жок' });
        toast({
          title: friendly.title,
          description: friendly.description,
          variant: 'destructive',
        });
      })
      .finally(() => setIsAssignablesLoading(false));
  }, [isEditOpen, toast]);

  const handleSave = async () => {
    if (!contact || !form.fullName) return;

    setIsSaving(true);
    try {
      const updatedContact = await legacyContactsApi.update(contact.id, {
        fullName: form.fullName,
        status: form.status || undefined,
        notes: form.notes || undefined,
        priority: form.priority ? Number(form.priority) : undefined,
        tags: form.tags ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : undefined,
        courseName: form.courseName || undefined,
        courseType: form.courseType || undefined,
        nextFollowUpAt: form.nextFollowUpAt || null,
        lastContactedAt: form.lastContactedAt || null,
        outcome: form.outcome || undefined,
        outcomeDetail: form.outcomeDetail || undefined,
      }) as LegacyContactDetail;

      const requestedAssigneeUserId = form.assigneeUserId ? Number(form.assigneeUserId) : null;
      const currentAssigneeUserId = updatedContact.assignedToUserId ?? null;

      const finalContact = requestedAssigneeUserId !== currentAssigneeUserId
        ? await legacyContactsApi.assign({
            contactId: contact.id,
            assigneeUserId: requestedAssigneeUserId,
          })
        : updatedContact;

      setContact(finalContact as LegacyContactDetail);
      setIsEditOpen(false);
      toast({ title: 'Эски байланыш ийгиликтүү өзгөртүлдү' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Эски байланышты сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = async () => {
    if (!contact) return;
    setIsImporting(true);
    try {
      const lead = await leadsApi.importFromContact(contact.id);
      toast({ title: `Эски байланыш лидге өткөрүлдү (#${lead.id})` });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Эски байланышты лидге өткөрүү ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{error || 'Байланыш табылган жок'}</p>
        <Button variant="outline" onClick={() => navigate('/legacy-contacts')}><ArrowLeft className="mr-2 h-4 w-4" />{ky.common.back}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`${contact.fullName} (Эски жазуу)`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/legacy-contacts')}>
              <ArrowLeft className="mr-2 h-4 w-4" />{ky.common.back}
            </Button>
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>{ky.common.edit}</Button>
            <Button variant="outline" onClick={handleImport} disabled={isImporting}>
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
              Лидге өткөрүү
            </Button>
          </div>
        }
      />
      <Card className="border-border/60 bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Бул тарыхый contact record. Аны күнүмдүк sales process'те колдонбоңуз. Эгер жазууну жаңы CRM workflow'га кайтаруу керек болсо, аны lead'ге import кылыңыз.
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card border-border/50 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Эски байланыш маалыматы</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={User} label={ky.common.name} value={contact.fullName} />
              <InfoRow icon={Phone} label={ky.common.phone} value={contact.phone} />
              <InfoRow icon={Mail} label={ky.common.email} value={contact.email || '—'} />
              <InfoRow icon={Tag} label="Статус" value={statusLabels[contact.status || ''] || contact.status || '—'} />
              <InfoRow icon={Tag} label="Булак" value={sourceLabels[contact.source || ''] || contact.source || '—'} />
              <InfoRow icon={UserCog} label="Жооптуу" value={contact.assignedToName || 'Дайындалган эмес'} />
              <InfoRow icon={UserCog} label="Түзгөн" value={contact.createdByName || '—'} />
              <InfoRow icon={UserCog} label="Акыркы өзгөрткөн" value={contact.updatedByName || '—'} />
              <InfoRow icon={ClipboardList} label="Курс" value={contact.courseName || '—'} />
              <InfoRow icon={ClipboardList} label="Курс түрү" value={courseTypeLabels[contact.courseType || ''] || contact.courseType || '—'} />
              <InfoRow icon={CalendarClock} label="Акыркы байланыш" value={formatDateTime(contact.lastContactedAt)} />
              <InfoRow icon={CalendarClock} label="Кийинки follow-up" value={formatDateTime(contact.nextFollowUpAt)} />
              <InfoRow icon={CalendarClock} label="Акыркы аракет" value={formatDateTime(contact.lastAttemptAt)} />
              <InfoRow icon={ClipboardList} label="Аракет саны" value={String(contact.contactAttempts ?? 0)} />
              <InfoRow icon={ClipboardList} label="Приоритет" value={contact.priority != null ? String(contact.priority) : '—'} />
              <InfoRow icon={ClipboardList} label="Жыйынтык" value={outcomeLabels[contact.outcome || ''] || contact.outcome || '—'} />
            </div>

            {contact.tags && contact.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{ky.common.tags}</p>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-card border-border/50">
            <CardHeader><CardTitle className="text-base">{ky.common.notes}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{contact.notes || 'Эскертүүлөр жок'}</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader><CardTitle className="text-base">Кошумча маалымат</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="text-xs">Source provider</p>
                <p className="font-medium text-foreground">{contact.sourceProvider || '—'}</p>
              </div>
              <div>
                <p className="text-xs">UTM Source</p>
                <p className="font-medium text-foreground">{contact.utmSource || '—'}</p>
              </div>
              <div>
                <p className="text-xs">UTM Medium</p>
                <p className="font-medium text-foreground">{contact.utmMedium || '—'}</p>
              </div>
              <div>
                <p className="text-xs">UTM Campaign</p>
                <p className="font-medium text-foreground">{contact.utmCampaign || '—'}</p>
              </div>
              <div>
                <p className="text-xs">Outcome detail</p>
                <p className="font-medium text-foreground">{contact.outcomeDetail || '—'}</p>
              </div>
              <div>
                <p className="text-xs">Алгачкы билдирүү</p>
                <p className="font-medium text-foreground whitespace-pre-wrap">{contact.message || '—'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{ky.common.edit}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{ky.common.name} *</Label>
                <Input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={form.status || '__none__'} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value === '__none__' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Статус тандаңыз" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Тандалган эмес</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Жооптуу</Label>
                <Select value={form.assigneeUserId || '__none__'} onValueChange={(value) => setForm((prev) => ({ ...prev, assigneeUserId: value === '__none__' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAssignablesLoading ? 'Жүктөлүүдө...' : 'Жооптуу колдонуучуну тандаңыз'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Дайындалган эмес</SelectItem>
                    {assignables.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.fullName} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{ky.common.notes}</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Приоритет</Label>
                <Input type="number" value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{ky.common.tags}</Label>
                <Input value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} placeholder="tag1, tag2" />
              </div>
              <div className="space-y-2">
                <Label>Курс</Label>
                <Input value={form.courseName} onChange={(e) => setForm((prev) => ({ ...prev, courseName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Курс түрү</Label>
                <Select value={form.courseType || '__none__'} onValueChange={(value) => setForm((prev) => ({ ...prev, courseType: value === '__none__' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Курс түрүн тандаңыз" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Тандалган эмес</SelectItem>
                    {Object.entries(courseTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Акыркы байланыш</Label>
                <Input type="datetime-local" value={form.lastContactedAt} onChange={(e) => setForm((prev) => ({ ...prev, lastContactedAt: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Кийинки follow-up</Label>
                <Input type="datetime-local" value={form.nextFollowUpAt} onChange={(e) => setForm((prev) => ({ ...prev, nextFollowUpAt: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Жыйынтык</Label>
                <Select value={form.outcome || '__none__'} onValueChange={(value) => setForm((prev) => ({ ...prev, outcome: value === '__none__' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Жыйынтык тандаңыз" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Тандалган эмес</SelectItem>
                    {Object.entries(outcomeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Жыйынтык түшүндүрмөсү</Label>
                <Textarea value={form.outcomeDetail} onChange={(e) => setForm((prev) => ({ ...prev, outcomeDetail: e.target.value }))} rows={3} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
              {ky.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.fullName}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSaving && <Save className="mr-2 h-4 w-4" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ky-KG');
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-muted p-2"><Icon className="h-4 w-4 text-muted-foreground" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
