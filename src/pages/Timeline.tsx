import { useState, useEffect } from 'react';
import { PageHeader, PageEmpty } from '@/components/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ky } from '@/lib/i18n';
import { Phone, Mail, MessageSquare, FileText, Calendar, Monitor, Search, Plus, Loader2 } from 'lucide-react';
import type { TimelineEvent } from '@/types';
import { timelineApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, React.ElementType> = {
  call: Phone, email: Mail, sms: MessageSquare, whatsapp: MessageSquare,
  telegram: MessageSquare, note: FileText, meeting: Calendar, system: Monitor,
};

const emptyForm = { type: 'note', message: '', leadId: '', contactId: '', dealId: '' };

export default function TimelinePage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchEvents = () => {
    setIsLoading(true);
    timelineApi.list({ search, type: typeFilter === 'all' ? undefined : typeFilter })
      .then((res) => setEvents(res.items))
      .catch(() => setEvents([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchEvents(); }, [search, typeFilter]);

  const handleCreate = async () => {
    if (!form.message) return;
    setIsCreating(true);
    try {
      await timelineApi.add({
        type: form.type,
        message: form.message,
        leadId: form.leadId ? Number(form.leadId) : undefined,
        contactId: form.contactId ? Number(form.contactId) : undefined,
        dealId: form.dealId ? Number(form.dealId) : undefined,
      });
      toast({ title: 'Жазуу ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      fetchEvents();
    } catch {
      toast({ title: 'Жазуу кошууда ката кетти', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={ky.timelineLabels.title}
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.timelineLabels.addEvent}</Button>}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={ky.common.search} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ky.common.all}</SelectItem>
            {Object.entries(ky.timelineType).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : events.length === 0 ? <PageEmpty /> : (
        <div className="relative ml-4 border-l-2 border-border pl-6 space-y-4">
          {events.map((event) => {
            const Icon = iconMap[event.type] || FileText;
            return (
              <div key={event.id} className="relative">
                <div className="absolute -left-[calc(1.5rem+9px)] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-card border-2 border-primary">
                  <Icon className="h-2.5 w-2.5 text-primary" />
                </div>
                <Card className="shadow-soft border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium">{event.message}</p>
                      <span className="shrink-0 text-xs text-muted-foreground ml-4">
                        {new Date(event.createdAt).toLocaleString('ky-KG', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {ky.timelineType[event.type]}
                      {event.leadId ? ` • Лид #${event.leadId}` : ''}
                      {event.contactId ? ` • Байланыш #${event.contactId}` : ''}
                      {event.dealId ? ` • Келишим #${event.dealId}` : ''}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>{ky.timelineLabels.addEvent}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Түрү</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ky.timelineType).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Билдирүү *</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Билдирүү текстин жазыңыз..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Лид ID</Label>
                <Input type="number" value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} placeholder="Лид ID" />
              </div>
              <div className="space-y-2">
                <Label>Байланыш ID</Label>
                <Input type="number" value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} placeholder="Байланыш ID" />
              </div>
              <div className="space-y-2">
                <Label>Келишим ID</Label>
                <Input type="number" value={form.dealId} onChange={(e) => setForm({ ...form, dealId: e.target.value })} placeholder="Келишим ID" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || !form.message}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
