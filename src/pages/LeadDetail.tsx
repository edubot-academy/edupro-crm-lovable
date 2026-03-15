import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { ky } from '@/lib/i18n';
import { ArrowLeft, Phone, Mail, Tag, User, BookOpen, MessageSquare, Loader2 } from 'lucide-react';
import { leadsApi } from '@/api/modules';
import type { Lead } from '@/types';

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <Button variant="outline">{ky.common.edit}</Button>
            <Button>{ky.leads.convertToContact}</Button>
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
