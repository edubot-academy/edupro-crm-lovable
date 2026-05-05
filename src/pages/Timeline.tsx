import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import type { Contact, Deal, Lead, PaginatedResponse, TimelineEvent } from '@/types';
import { contactApi, dealsApi, leadsApi, timelineApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';
import { toDateTimeLocalValue, toIsoFromDateTimeLocal } from '@/lib/datetime';
import { useFeatureFlags } from '@/components/core/FeatureFlagProvider';
import { Badge } from '@/components/ui/badge';
import { UnmatchedWhatsAppQueueCard } from '@/components/whatsapp/UnmatchedWhatsAppQueueCard';
import {
  formatWhatsAppMessageType,
  getWhatsAppEventDirection,
  getWhatsAppEventLabel,
  isWhatsAppTimelineEvent,
} from '@/components/whatsapp/whatsapp-utils';

const iconMap: Record<string, React.ElementType> = {
  call: Phone, email: Mail, sms: MessageSquare, whatsapp: MessageSquare,
  telegram: MessageSquare, note: FileText, meeting: Calendar, system: Monitor,
};

const emptyForm = { type: 'note', message: '', scheduledAt: '', leadId: '', contactId: '', dealId: '' };
const pageSize = 20;

export default function TimelinePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { isFeatureEnabled } = useFeatureFlags();
  const isWhatsAppEnabled = isFeatureEnabled('whatsapp_integration_enabled');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const isSchedulableType = form.type === 'call' || form.type === 'meeting';
  const shouldOpenCreate = searchParams.get('create') === '1';
  const search = searchParams.get('q') || '';
  const typeFilter = searchParams.get('typeFilter') || 'all';
  const currentPage = Math.max(1, Number(searchParams.get('page') || '1'));
  const prefillType = searchParams.get('type') || '';
  const prefillLeadId = searchParams.get('leadId') || '';
  const prefillContactId = searchParams.get('contactId') || '';
  const prefillDealId = searchParams.get('dealId') || '';
  const prefillMessage = searchParams.get('message') || '';
  const prefillScheduledAt = toDateTimeLocalValue(searchParams.get('scheduledAt') || '');

  const clearPrefillParams = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('create');
      next.delete('type');
      next.delete('leadId');
      next.delete('contactId');
      next.delete('dealId');
      next.delete('message');
      next.delete('scheduledAt');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const resetCreateForm = useCallback(() => {
    setForm(emptyForm);
    clearPrefillParams();
    setShowCreate(false);
  }, [clearPrefillParams]);

  const fetchEvents = useCallback(() => {
    setIsLoading(true);
    const load = async () => {
      if (typeFilter !== 'whatsapp_release3') {
        const requestedType = typeFilter === 'all' ? undefined : typeFilter;
        const res = await timelineApi.list({
          search: search || undefined,
          type: requestedType,
          page: currentPage,
          limit: pageSize,
        });
        return {
          items: res.items,
          total: res.total,
        };
      }

      let sourcePage = 1;
      let totalPages = 1;
      const collected: TimelineEvent[] = [];

      do {
        const res = await timelineApi.list({ search: search || undefined, page: sourcePage, limit: 100 });
        collected.push(...res.items.filter(isWhatsAppTimelineEvent));
        totalPages = res.totalPages;
        sourcePage += 1;
      } while (sourcePage <= totalPages);

      const total = collected.length;
      const start = (currentPage - 1) * pageSize;
      return {
        items: collected.slice(start, start + pageSize),
        total,
      };
    };

    load()
      .then((result) => {
        setEvents(result.items);
        setTotalItems(result.total);
      })
      .catch(() => {
        setEvents([]);
        setTotalItems(0);
      })
      .finally(() => setIsLoading(false));
  }, [currentPage, search, typeFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const loadAllPages = useCallback(async <T,>(
    loader: (params: { page: number; limit: number }) => Promise<PaginatedResponse<T>>,
  ) => {
    const firstPage = await loader({ page: 1, limit: 100 });
    const items = [...firstPage.items];

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const nextPage = await loader({ page, limit: 100 });
      items.push(...nextPage.items);
    }

    return items;
  }, []);

  useEffect(() => {
    if (!shouldOpenCreate) return;
    setShowCreate(true);
  }, [shouldOpenCreate]);

  useEffect(() => {
    if (!showCreate) return;
    let cancelled = false;
    setOptionsLoading(true);
    Promise.all([
      loadAllPages((params) => leadsApi.list(params)),
      loadAllPages((params) => contactApi.list(params)),
      loadAllPages((params) => dealsApi.list(params)),
    ])
      .then(([allLeads, allContacts, allDeals]) => {
        if (cancelled) return;
        setLeads(allLeads);
        setContacts(allContacts);
        setDeals(allDeals);
      })
      .catch(() => {
        if (cancelled) return;
        setLeads([]);
        setContacts([]);
        setDeals([]);
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadAllPages, showCreate]);

  useEffect(() => {
    if (!showCreate) return;
    setForm((prev) => ({
      ...prev,
      type: prefillType || prev.type,
      leadId: prefillLeadId || prev.leadId,
      contactId: prefillContactId || prev.contactId,
      dealId: prefillDealId || prev.dealId,
      message: prefillMessage || prev.message,
      scheduledAt: prefillScheduledAt || prev.scheduledAt,
    }));
  }, [showCreate, prefillType, prefillLeadId, prefillContactId, prefillDealId, prefillMessage, prefillScheduledAt]);

  useEffect(() => {
    if (!form.dealId) return;
    const selectedDeal = deals.find((deal) => String(deal.id) === form.dealId);
    if (!selectedDeal?.contactId) return;

    setForm((prev) => (
      prev.contactId === String(selectedDeal.contactId)
        ? prev
        : { ...prev, contactId: String(selectedDeal.contactId) }
    ));
  }, [deals, form.dealId]);

  useEffect(() => {
    if (!form.leadId) return;
    const selectedLead = leads.find((lead) => String(lead.id) === form.leadId);
    if (!selectedLead?.contactId) return;

    setForm((prev) => (
      prev.contactId === String(selectedLead.contactId)
        ? prev
        : { ...prev, contactId: String(selectedLead.contactId) }
    ));
  }, [form.leadId, leads]);

  const setQueryParam = (key: string, value?: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value && value.trim()) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== 'page') {
        next.set('page', '1');
      }
      return next;
    }, { replace: true });
  };

  const handleCreate = async () => {
    const trimmedMessage = form.message.trim();
    const defaultMessage =
      form.type === 'call'
        ? 'Чалуу пландалды'
        : form.type === 'meeting'
          ? 'Жолугушуу пландалды'
          : '';
    const finalMessage = trimmedMessage || defaultMessage;
    const scheduledAtIso = isSchedulableType ? toIsoFromDateTimeLocal(form.scheduledAt) : null;

    if (!finalMessage) return;
    if (isSchedulableType && !scheduledAtIso) {
      toast({
        title: 'Пландалган убакытты тандаңыз',
        description: 'Чалуу же жолугушуу үчүн так убакыт керек.',
        variant: 'destructive',
      });
      return;
    }
    setIsCreating(true);
    try {
      await timelineApi.add({
        type: form.type,
        message: finalMessage,
        leadId: form.leadId ? Number(form.leadId) : undefined,
        contactId: form.contactId ? Number(form.contactId) : undefined,
        dealId: form.dealId ? Number(form.dealId) : undefined,
        meta: scheduledAtIso ? { scheduledAt: scheduledAtIso } : undefined,
      });
      toast({ title: 'Жазуу ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      clearPrefillParams();
      fetchEvents();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Жазууну сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
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
      {isWhatsAppEnabled ? <UnmatchedWhatsAppQueueCard /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={ky.common.search} aria-label="Байланыш тарыхын издөө" value={search} onChange={(e) => setQueryParam('q', e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(value) => setQueryParam('typeFilter', value === 'all' ? '' : value)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ky.common.all}</SelectItem>
            {Object.entries(ky.timelineType).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            {isWhatsAppEnabled ? <SelectItem value="whatsapp_release3">WhatsApp Release 3</SelectItem> : null}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : events.length === 0 ? <PageEmpty /> : (
        <div className="space-y-4">
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
                        <div className="space-y-1">
                          {isWhatsAppTimelineEvent(event) ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">WhatsApp</Badge>
                              <Badge variant={getWhatsAppEventDirection(event) === 'inbound' ? 'default' : getWhatsAppEventDirection(event) === 'outbound' ? 'outline' : 'secondary'}>
                                {getWhatsAppEventDirection(event) === 'inbound'
                                  ? 'Кирген'
                                  : getWhatsAppEventDirection(event) === 'outbound'
                                    ? 'Чыккан'
                                    : 'Статус'}
                              </Badge>
                              <Badge variant="outline">{getWhatsAppEventLabel(event)}</Badge>
                              <Badge variant="outline">{formatWhatsAppMessageType(event.meta?.messageType)}</Badge>
                            </div>
                          ) : null}
                          <p className="text-sm font-medium">{event.message}</p>
                          {typeof event.meta?.scheduledAt === 'string' && event.meta.scheduledAt && (
                            <p className="text-xs text-primary">
                              Пландалган убакыт: {new Date(event.meta.scheduledAt).toLocaleString('ky-KG', { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                          )}
                          {event.creatorUserName ? (
                            <p className="text-xs text-muted-foreground">
                              Автор: {event.creatorUserName}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground ml-4">
                          {new Date(event.createdAt).toLocaleString('ky-KG', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {isWhatsAppTimelineEvent(event) ? getWhatsAppEventLabel(event) : ky.timelineType[event.type]}
                        {event.lead ? ` • Лид: ${event.lead.fullName}` : event.leadId ? ` • Лид #${event.leadId}` : ''}
                        {event.contact ? ` • Байланыш: ${event.contact.fullName}` : event.contactId ? ` • Байланыш #${event.contactId}` : ''}
                        {event.deal ? ` • Келишим: #${event.deal.id}${event.deal.contactName ? ` (${event.deal.contactName})` : ''}` : event.dealId ? ` • Келишим #${event.dealId}` : ''}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          {totalItems > pageSize ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} / {totalItems}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setQueryParam('page', String(Math.max(1, currentPage - 1)))} disabled={currentPage === 1}>
                  Артка
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQueryParam('page', String(currentPage + 1))} disabled={currentPage * pageSize >= totalItems}>
                  Алга
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => {
        setShowCreate(open);
        if (!open) {
          setForm(emptyForm);
          clearPrefillParams();
        }
      }}>
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
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={isSchedulableType ? 'Кааласаңыз кыскача комментарий жазыңыз...' : 'Билдирүү текстин жазыңыз...'}
              />
            </div>
            {isSchedulableType && (
              <div className="space-y-2">
                <Label>Пландалган убакыт</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Лид</Label>
                <Select
                  value={form.leadId || '__none__'}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, leadId: value === '__none__' ? '' : value }))}
                  disabled={optionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={optionsLoading ? 'Жүктөлүүдө...' : 'Лидди тандаңыз'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Тандалган эмес</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={String(lead.id)}>
                        {lead.fullName} {lead.phone ? `• ${lead.phone}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Байланыш</Label>
                <Select
                  value={form.contactId || '__none__'}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, contactId: value === '__none__' ? '' : value }))}
                  disabled={optionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={optionsLoading ? 'Жүктөлүүдө...' : 'Байланышты тандаңыз'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Тандалган эмес</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={String(contact.id)}>
                        {contact.fullName} {contact.phone ? `• ${contact.phone}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Келишим</Label>
                <Select
                  value={form.dealId || '__none__'}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, dealId: value === '__none__' ? '' : value }))}
                  disabled={optionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={optionsLoading ? 'Жүктөлүүдө...' : 'Келишимди тандаңыз'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Тандалган эмес</SelectItem>
                    {deals.map((deal) => (
                      <SelectItem key={deal.id} value={String(deal.id)}>
                        #{deal.id} {deal.contact?.fullName ? `• ${deal.contact.fullName}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetCreateForm}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || (!form.message.trim() && !isSchedulableType) || (isSchedulableType && !form.scheduledAt)}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
