import { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { timelineApi, whatsappApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';
import type { TimelineEvent, WhatsAppConversationDetail, WhatsAppMessageSummary } from '@/types';
import {
  formatDateTime,
  formatWhatsAppMessageType,
  getWhatsAppEventDirection,
  getWhatsAppEventLabel,
  isWhatsAppTimelineEvent,
} from './whatsapp-utils';

interface RecordWhatsAppTimelineCardProps {
  leadId?: number;
  contactId?: number;
  dealId?: number;
}

function getConversationIdFromMeta(meta: TimelineEvent['meta']) {
  const rawValue = meta?.conversationId;
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function RecordWhatsAppTimelineCard({
  leadId,
  contactId,
  dealId,
}: RecordWhatsAppTimelineCardProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [conversationDetail, setConversationDetail] = useState<WhatsAppConversationDetail | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessageSummary[]>([]);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const conversationIds = useMemo(() => {
    const uniqueIds = new Set<number>();
    for (const event of events) {
      const conversationId = getConversationIdFromMeta(event.meta);
      if (conversationId) {
        uniqueIds.add(conversationId);
      }
    }
    return Array.from(uniqueIds);
  }, [events]);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    const loadAllPages = async () => {
      const firstPage = await timelineApi.list({
        leadId,
        contactId,
        dealId,
        page: 1,
        limit: 100,
      });
      const items = [...firstPage.items];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await timelineApi.list({
          leadId,
          contactId,
          dealId,
          page,
          limit: 100,
        });
        items.push(...nextPage.items);
      }

      return items;
    };

    loadAllPages()
      .then((items) => {
        if (!isMounted) return;
        setEvents(items.filter(isWhatsAppTimelineEvent));
      })
      .catch(() => {
        if (!isMounted) return;
        setEvents([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [contactId, dealId, leadId]);

  useEffect(() => {
    if (conversationIds.length === 0) {
      setSelectedConversationId('');
      return;
    }

    if (!selectedConversationId || !conversationIds.includes(Number(selectedConversationId))) {
      setSelectedConversationId(String(conversationIds[0]));
    }
  }, [conversationIds, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setConversationDetail(null);
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsConversationLoading(true);

    Promise.all([
      whatsappApi.getConversation(Number(selectedConversationId)),
      whatsappApi.getConversationMessages(Number(selectedConversationId), { limit: 20, offset: 0 }),
    ])
      .then(([detail, messagesResponse]) => {
        if (!isMounted) return;
        setConversationDetail(detail);
        setMessages(messagesResponse.messages);
      })
      .catch(() => {
        if (!isMounted) return;
        setConversationDetail(null);
        setMessages([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsConversationLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedConversationId]);

  const handleSendMessage = async () => {
    const body = draftMessage.trim();
    if (!selectedConversationId || !body) return;

    setIsSending(true);
    try {
      const response = await whatsappApi.sendConversationMessage(Number(selectedConversationId), { body, message_type: 'text' });
      toast({ title: response.message });
      setDraftMessage('');

      const [detail, messagesResponse] = await Promise.all([
        whatsappApi.getConversation(Number(selectedConversationId)),
        whatsappApi.getConversationMessages(Number(selectedConversationId), { limit: 20, offset: 0 }),
        (async () => {
          const firstPage = await timelineApi.list({
            leadId,
            contactId,
            dealId,
            page: 1,
            limit: 100,
          });
          const items = [...firstPage.items];

          for (let page = 2; page <= firstPage.totalPages; page += 1) {
            const nextPage = await timelineApi.list({
              leadId,
              contactId,
              dealId,
              page,
              limit: 100,
            });
            items.push(...nextPage.items);
          }

          setEvents(items.filter(isWhatsAppTimelineEvent));
        })(),
      ]);

      setConversationDetail(detail);
      setMessages(messagesResponse.messages);
    } catch {
      toast({
        title: 'WhatsApp билдирүүсүн жөнөтүү мүмкүн болгон жок',
        description: 'Tenant WhatsApp интеграциясы туташканын жана бул сүйлөшүүгө кирүү укугуңуз бар экенин текшериңиз.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          WhatsApp тарыхы
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            WhatsApp окуялары жүктөлүүдө...
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Бул жазууга байланышкан WhatsApp окуялары азырынча жок.
          </p>
        ) : (
          <>
            {conversationIds.length > 0 ? (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Тирүү сүйлөшүү</p>
                    <p className="text-xs text-muted-foreground">
                      Sales командасы ушул сүйлөшүүдөн түз эле WhatsApp билдирүүсүн жөнөтө алат.
                    </p>
                  </div>
                  {conversationIds.length > 1 ? (
                    <div className="w-full sm:w-56">
                      <Select value={selectedConversationId} onValueChange={setSelectedConversationId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Сүйлөшүүнү тандаңыз" />
                        </SelectTrigger>
                        <SelectContent>
                          {conversationIds.map((conversationId) => (
                            <SelectItem key={conversationId} value={String(conversationId)}>
                              Сүйлөшүү #{conversationId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>

                {isConversationLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Сүйлөшүү жүктөлүүдө...
                  </div>
                ) : conversationDetail ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">Conversation #{conversationDetail.id}</Badge>
                      <Badge variant={conversationDetail.unread_count > 0 ? 'destructive' : 'outline'}>
                        {conversationDetail.unread_count > 0 ? `${conversationDetail.unread_count} окула элек` : 'Баары окулган'}
                      </Badge>
                      <Badge variant="outline">{conversationDetail.customer_info.phone}</Badge>
                    </div>

                    <div className="space-y-2">
                      {messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Бул сүйлөшүүдө билдирүү тарыхы азырынча жок.
                        </p>
                      ) : (
                        messages.map((message) => (
                          <div key={message.id} className="rounded-xl border border-border/60 bg-background p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={message.direction === 'inbound' ? 'default' : 'outline'}>
                                {message.direction === 'inbound' ? 'Кирген' : 'Чыккан'}
                              </Badge>
                              <Badge variant="outline">{formatWhatsAppMessageType(message.message_type)}</Badge>
                              <Badge variant="outline">{message.status}</Badge>
                            </div>
                            <p className="mt-3 text-sm text-foreground">
                              {message.body || 'Бул билдирүүнүн тексттик мазмуну жок.'}
                            </p>
                            {message.provider_error ? (
                              <p className="mt-2 text-xs text-destructive">{message.provider_error}</p>
                            ) : null}
                            <p className="mt-2 text-xs text-muted-foreground">
                              {formatDateTime(message.received_at || message.sent_at || message.created_at)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        value={draftMessage}
                        onChange={(event) => setDraftMessage(event.target.value)}
                        placeholder="Кардарга WhatsApp билдирүүсүн жазыңыз..."
                        maxLength={4096}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Текст билдирүү гана колдоого алынат. WhatsApp саясат чектөөлөрү серверде текшерилет.
                        </p>
                        <Button onClick={handleSendMessage} disabled={isSending || !draftMessage.trim()}>
                          {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                          Жөнөтүү
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Бул сүйлөшүүнүн деталдарын азыр жүктөө мүмкүн болгон жок.
                  </p>
                )}
              </div>
            ) : null}

            <div className="space-y-3">
              {events.map((event) => {
                const direction = getWhatsAppEventDirection(event);
                const messageType = formatWhatsAppMessageType(event.meta?.messageType);

                return (
                  <div key={event.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">WhatsApp</Badge>
                      <Badge variant={direction === 'inbound' ? 'default' : direction === 'outbound' ? 'outline' : 'secondary'}>
                        {direction === 'inbound' ? 'Кирген' : direction === 'outbound' ? 'Чыккан' : 'Статус'}
                      </Badge>
                      <Badge variant="outline">{getWhatsAppEventLabel(event)}</Badge>
                      <Badge variant="outline">{messageType}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-foreground">{event.message}</p>
                    {messageType !== 'Текст' ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Бул формат толук көрсөтүлбөйт. Таймлайнда коопсуз кыскача көрүнүш гана берилет.
                      </p>
                    ) : null}
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
