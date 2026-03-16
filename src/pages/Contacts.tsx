import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ky } from '@/lib/i18n';
import { contactApi, leadsApi } from '@/api/modules';
import type { Contact } from '@/types';
import { Loader2, Mail, Phone, IdCard, Database, ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mockContacts: Contact[] = [
  { id: 1, fullName: 'Элнура Турдалиева', phone: '+996 558 678901', email: 'elnura@mail.kg', lmsStudentId: 'LMS-001', createdAt: '2024-02-15', updatedAt: '2024-03-01' },
  { id: 2, fullName: 'Данияр Абдыраев', phone: '+996 502 567890', email: 'daniyar@mail.kg', lmsStudentId: 'LMS-002', createdAt: '2024-02-20', updatedAt: '2024-03-05' },
  { id: 3, fullName: 'Айтурган Маматова', phone: '+996 555 111222', email: 'aiturgan@mail.kg', createdAt: '2024-01-10', updatedAt: '2024-02-28' },
];

export default function ContactsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [importingId, setImportingId] = useState<number | null>(null);

  const fetchContacts = () => {
    setIsLoading(true);
    contactApi.list({ search })
      .then((res) => setContacts(res.items))
      .catch(() => setContacts(mockContacts))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchContacts(); }, [search]);

  const handleImport = async (contact: Contact) => {
    setImportingId(contact.id);
    try {
      const lead = await leadsApi.importFromContact(contact.id);
      toast({ title: `Legacy контакт лидге өткөрүлдү (#${lead.id})` });
    } catch {
      toast({ title: 'Legacy контактты лидге өткөрүүдө ката кетти', variant: 'destructive' });
    } finally {
      setImportingId(null);
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
        <Button variant="outline" size="sm" className="gap-2" disabled={importingId === c.id} onClick={(e) => { e.stopPropagation(); void handleImport(c); }}>
          {importingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
          Лидге өткөрүү
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
          <Database className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span>{contact.phone}</span></div>
          {contact.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span className="truncate">{contact.email}</span></div>}
          <div className="flex items-center gap-2"><IdCard className="h-3.5 w-3.5" /><span>{contact.lmsStudentId || 'LMS ID жок'}</span></div>
        </div>
        {contact.notes && <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground line-clamp-3">{contact.notes}</p>}
        <Button variant="outline" size="sm" className="w-full gap-2" disabled={importingId === contact.id} onClick={(e) => { e.stopPropagation(); void handleImport(contact); }}>
          {importingId === contact.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
          Лидге өткөрүү
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.contacts.title} />
      <Card className="border-border/60 bg-muted/30">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium">Бул бөлүм күнүмдүк CRM workflow үчүн эмес.</p>
            <p className="text-sm text-muted-foreground">
              Бул жерде эски contact жазууларын көрөсүз, тарыхый маалыматты текшересиз жана керектүүсүн жаңы lead workflow'га өткөрөсүз.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">Superadmin migration tool</div>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={contacts} isLoading={isLoading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Legacy контакт издөө..." onRowClick={(c) => navigate(`/contacts/${c.id}`)} renderMobileCard={renderMobileCard} />
    </div>
  );
}
