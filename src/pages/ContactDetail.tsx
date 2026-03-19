import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ky } from '@/lib/i18n';
import { ArrowLeft, Phone, Mail, User, Link2, Loader2 } from 'lucide-react';
import { contactApi } from '@/api/modules';
import type { Contact } from '@/types';

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    contactApi.get(Number(id))
      .then(setContact)
      .catch(() => setError('Байланыш табылган жок'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{error || 'Байланыш табылган жок'}</p>
        <Button variant="outline" onClick={() => navigate('/contacts')}><ArrowLeft className="mr-2 h-4 w-4" />{ky.common.back}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={contact.fullName}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/contacts')}>
              <ArrowLeft className="mr-2 h-4 w-4" />{ky.common.back}
            </Button>
            <Button variant="outline">{ky.common.edit}</Button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card border-border/50 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Байланыш маалыматы</CardTitle></CardHeader>
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
