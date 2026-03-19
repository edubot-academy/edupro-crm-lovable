import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { ky } from '@/lib/i18n';
import { ArrowLeft, Phone, Mail, Tag, User, BookOpen, MessageSquare, Loader2, Save } from 'lucide-react';
import { leadsApi, usersApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';
import type { AssignableUser, Lead, LeadSource, LeadStatus } from '@/types';

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [managers, setManagers] = useState<AssignableUser[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    source: '' as LeadSource | '',
    status: 'new' as LeadStatus,
    assignedManagerId: '',
    notes: '',
  });

  useEffect(() => {
    if (!id || id === 'new') return;
    const numId = Number(id);
    if (isNaN(numId)) { setError('Лид табылган жок'); setIsLoading(false); return; }
    setIsLoading(true);
    leadsApi.get(numId)
      .then(setLead)
      .catch(() => setError('Лид табылган жок'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!lead) return;
    setForm({
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      assignedManagerId: lead.assignedManager?.id ? String(lead.assignedManager.id) : '',
      notes: lead.notes || '',
    });
  }, [lead]);

  useEffect(() => {
    if (!isEditOpen) return;
    setManagersLoading(true);
    usersApi.assignables()
      .then(setManagers)
      .catch(() => setManagers([]))
      .finally(() => setManagersLoading(false));
  }, [isEditOpen]);

  const handleSave = async () => {
    if (!lead || !form.fullName || !form.phone || !form.source) return;

    setIsSaving(true);
    try {
      const updatedLead = await leadsApi.update(lead.id, {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        source: form.source,
        status: form.status,
        assignedManagerId: form.assignedManagerId ? Number(form.assignedManagerId) : null,
        notes: form.notes || undefined,
      });
      setLead(updatedLead);
      setIsEditOpen(false);
      toast({ title: 'Лид ийгиликтүү өзгөртүлдү' });
    } catch {
      toast({ title: 'Лидди өзгөртүүдө ката кетти', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToContact = async () => {
    if (!lead) return;

    setIsConverting(true);
    try {
      const contact = await leadsApi.convertToContact(lead.id);
      setLead((prev) => (prev ? { ...prev, contactId: contact.id } : prev));
      toast({ title: 'Лид ийгиликтүү байланышка айландырылды' });
      navigate(`/contacts/${contact.id}`);
    } catch {
      toast({ title: 'Лидди байланышка айландырууда ката кетти', variant: 'destructive' });
    } finally {
      setIsConverting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{error || 'Лид табылган жок'}</p>
        <Button variant="outline" onClick={() => navigate('/leads')}><ArrowLeft className="mr-2 h-4 w-4" />{ky.common.back}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={lead.fullName}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/leads')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {ky.common.back}
            </Button>
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              {ky.common.edit}
            </Button>
            <Button onClick={handleConvertToContact} disabled={isConverting || !!lead.contactId}>
              {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lead.contactId ? 'Байланышка айланган' : ky.leads.convertToContact}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Лид маалыматы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={User} label={ky.common.name} value={lead.fullName} />
              <InfoRow icon={Phone} label={ky.common.phone} value={lead.phone} />
              <InfoRow icon={Mail} label={ky.common.email} value={lead.email} />
              <InfoRow icon={MessageSquare} label={ky.leads.source} value={ky.leadSource[lead.source]} />
              <InfoRow icon={BookOpen} label={ky.leads.interestedCourse} value={lead.interestedCourseId || '—'} />
              <InfoRow icon={User} label={ky.leads.assignedManager} value={lead.assignedManager?.fullName || '—'} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{ky.common.status}</p>
              <StatusBadge variant={getLeadStatusVariant(lead.status)} dot>{ky.leadStatus[lead.status]}</StatusBadge>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">{ky.common.tags}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(lead.tags || []).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    <Tag className="h-3 w-3" />{tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">{ky.common.notes}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{lead.notes || 'Эскертүүлөр жок'}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
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
                <Label>{ky.common.phone} *</Label>
                <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{ky.common.email}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{ky.leads.source} *</Label>
                <Select value={form.source} onValueChange={(value) => setForm((prev) => ({ ...prev, source: value as LeadSource }))}>
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
              <div className="space-y-2 sm:col-span-2">
                <Label>{ky.common.status}</Label>
                <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as LeadStatus }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={ky.common.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ky.leadStatus).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{ky.leads.assignedManager}</Label>
                <Select value={form.assignedManagerId || '__none__'} onValueChange={(value) => setForm((prev) => ({ ...prev, assignedManagerId: value === '__none__' ? '' : value }))} disabled={managersLoading}>
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
              <Label>{ky.common.notes}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
              {ky.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.fullName || !form.phone || !form.source}>
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

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-muted p-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
