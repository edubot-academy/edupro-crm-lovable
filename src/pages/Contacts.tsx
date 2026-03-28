import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ky } from '@/lib/i18n';
import { contactApi } from '@/api/modules';
import type { Contact } from '@/types';
import { Plus, Trash2, Loader2, Mail, Phone, IdCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';

const emptyForm = { fullName: '', phone: '', email: '', notes: '' };

export default function ContactsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const resetCreateForm = () => {
    setForm(emptyForm);
    setShowCreate(false);
  };

  const fetchContacts = () => {
    setIsLoading(true);
    contactApi.list({ search })
      .then((res) => setContacts(res.items))
      .catch(() => setContacts([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchContacts(); }, [search]);

  const handleCreate = async () => {
    if (!form.fullName || !form.phone) return;
    setIsCreating(true);
    try {
      await contactApi.create({ fullName: form.fullName, phone: form.phone, email: form.email || undefined, notes: form.notes || undefined });
      toast({ title: 'Байланыш ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      fetchContacts();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Байланышты сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await contactApi.delete(deleteTarget.id);
      toast({ title: ky.contacts.deleteSuccess });
      setDeleteTarget(null);
      fetchContacts();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: ky.contacts.deleteError });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Contact>[] = [
    { key: 'fullName', header: ky.common.name, render: (c) => <span className="font-medium">{c.fullName}</span> },
    { key: 'phone', header: ky.common.phone },
    { key: 'email', header: ky.common.email, className: 'hidden md:table-cell' },
    { key: 'lmsStudentId', header: ky.contacts.lmsId, render: (c) => <span className="text-xs font-mono text-muted-foreground">{c.lmsStudentId || '—'}</span> },
    { key: 'notes', header: ky.common.notes, render: (c) => <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{c.notes || '—'}</span>, className: 'hidden lg:table-cell' },
    {
      key: 'actions', header: '', render: (c) => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const renderMobileCard = (contact: Contact) => (
    <Card className="shadow-card border-border/50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{contact.fullName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(contact.createdAt).toLocaleDateString('ky-KG')}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(contact); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span>{contact.phone}</span></div>
          {contact.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span className="truncate">{contact.email}</span></div>}
          <div className="flex items-center gap-2"><IdCard className="h-3.5 w-3.5" /><span>{contact.lmsStudentId || 'LMS ID жок'}</span></div>
        </div>
        {contact.notes && <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground line-clamp-3">{contact.notes}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={ky.contacts.title}
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.contacts.newContact}</Button>}
      />
      <DataTable columns={columns} data={contacts} isLoading={isLoading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Байланыш издөө..." onRowClick={(c) => navigate(`/contacts/${c.id}`)} renderMobileCard={renderMobileCard} />

      <Dialog open={showCreate} onOpenChange={(open) => {
        setShowCreate(open);
        if (!open) setForm(emptyForm);
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{ky.contacts.newContact}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{ky.common.name} *</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Толук аты" />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.phone} *</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+996 ..." />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.email}</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.notes}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Эскертүүлөр..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetCreateForm}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || !form.fullName || !form.phone}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ky.contacts.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{ky.contacts.deleteConfirmDesc}</AlertDialogDescription>
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
