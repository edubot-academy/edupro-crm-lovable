import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ky } from '@/lib/i18n';
import { ArrowLeft, Phone, Mail, User, Link2, Loader2, ArrowRightLeft, Save } from 'lucide-react';
import { legacyContactsApi, leadsApi } from '@/api/modules';
import type { Contact } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function LegacyContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    notes: '',
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
      phone: contact.phone,
      email: contact.email || '',
      notes: contact.notes || '',
    });
  }, [contact]);

  const handleSave = async () => {
    if (!contact || !form.fullName || !form.phone) return;

    setIsSaving(true);
    try {
      const updatedContact = await legacyContactsApi.update(contact.id, {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
        notes: form.notes || undefined,
      });
      setContact(updatedContact);
      setIsEditOpen(false);
      toast({ title: 'Эски байланыш ийгиликтүү өзгөртүлдү' });
    } catch {
      toast({ title: 'Эски байланышты өзгөртүүдө ката кетти', variant: 'destructive' });
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
    } catch {
      toast({ title: 'Эски байланышты лидге өткөрүүдө ката кетти', variant: 'destructive' });
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
              <InfoRow icon={Mail} label={ky.common.email} value={contact.email} />
              <InfoRow icon={Link2} label="LMS ID" value={contact.lmsStudentId || '—'} />
              <InfoRow icon={Link2} label="Тышкы ID" value={contact.externalStudentId || '—'} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-card border-border/50">
            <CardHeader><CardTitle className="text-base">{ky.common.notes}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{contact.notes || 'Эскертүүлөр жок'}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
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
              <div className="space-y-2 sm:col-span-2">
                <Label>{ky.common.email}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
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
            <Button onClick={handleSave} disabled={isSaving || !form.fullName || !form.phone}>
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
      <div className="rounded-md bg-muted p-2"><Icon className="h-4 w-4 text-muted-foreground" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
