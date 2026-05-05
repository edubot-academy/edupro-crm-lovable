import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Plug, RefreshCcw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { whatsappApi } from '@/api/modules';
import type {
  WhatsAppConversationStats,
  WhatsAppConversationSummary,
  WhatsAppSettings,
  WhatsAppWebhookEventSummary,
} from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';
import { formatDateTime, formatWhatsAppStatus } from './whatsapp-utils';

type FormState = {
  whatsapp_business_account_id: string;
  phone_number_id: string;
  display_phone_number: string;
  access_token: string;
};

const emptyForm: FormState = {
  whatsapp_business_account_id: '',
  phone_number_id: '',
  display_phone_number: '',
  access_token: '',
};

function getStatusVariant(status?: string) {
  if (status === 'connected') return 'default';
  if (status === 'pending') return 'secondary';
  if (status === 'disabled' || status === 'failed') return 'destructive';
  return 'outline';
}

export function WhatsAppSettingsPanel() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [stats, setStats] = useState<WhatsAppConversationStats | null>(null);
  const [latestConversation, setLatestConversation] = useState<WhatsAppConversationSummary | null>(null);
  const [failedEvents, setFailedEvents] = useState<WhatsAppWebhookEventSummary[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState<string | null>(null);

  const syncForm = (account: WhatsAppSettings | null) => {
    if (!account) {
      setForm(emptyForm);
      return;
    }
    setForm({
      whatsapp_business_account_id: account.whatsapp_business_account_id,
      phone_number_id: account.phone_number_id,
      display_phone_number: account.display_phone_number,
      access_token: '',
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    setUnavailableMessage(null);

    try {
      const [settingsResponse, statsResponse, failedResponse] = await Promise.all([
        whatsappApi.getSettings(),
        whatsappApi.getStats().catch(() => null),
        whatsappApi.getFailedWebhookEvents({ limit: 5 }).catch(() => null),
      ]);
      const conversationsResponse = await whatsappApi.getConversations({ limit: 1, offset: 0 }).catch(() => null);

      const nextSettings = 'id' in settingsResponse ? settingsResponse : null;
      setSettings(nextSettings);
      syncForm(nextSettings);
      setStats(statsResponse?.stats || null);
      setLatestConversation(conversationsResponse?.conversations?.[0] || null);
      setFailedEvents(failedResponse?.events || []);

      if (!('id' in settingsResponse) && settingsResponse.message) {
        setUnavailableMessage(settingsResponse.message);
      }
    } catch (error) {
      const friendly = getFriendlyError(error, {
        fallbackTitle: 'WhatsApp жөндөөлөрүн жүктөө мүмкүн болгон жок',
      });
      setUnavailableMessage(friendly.description || friendly.title);
      setSettings(null);
      setStats(null);
      setLatestConversation(null);
      setFailedEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = settings
        ? await whatsappApi.updateSettings({
          whatsapp_business_account_id: form.whatsapp_business_account_id,
          display_phone_number: form.display_phone_number,
          access_token: form.access_token || undefined,
        })
        : await whatsappApi.createSettings(form);

      setSettings(response.account);
      syncForm(response.account);
      toast({ title: response.message });
      await loadData();
    } catch (error) {
      const friendly = getFriendlyError(error, {
        fallbackTitle: 'WhatsApp жөндөөлөрүн сактоо ишке ашкан жок',
      });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const response = await whatsappApi.testConnection();
      toast({ title: response.message });
      await loadData();
    } catch (error) {
      const friendly = getFriendlyError(error, {
        fallbackTitle: 'Байланышты текшерүү ишке ашкан жок',
      });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisable = async () => {
    setIsDisabling(true);
    try {
      const response = await whatsappApi.disableSettings();
      toast({ title: response.message });
      await loadData();
    } catch (error) {
      const friendly = getFriendlyError(error, {
        fallbackTitle: 'WhatsApp интеграциясын өчүрүү мүмкүн болгон жок',
      });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsDisabling(false);
    }
  };

  const handleRetryWebhookEvent = async (eventId: number) => {
    try {
      const response = await whatsappApi.retryWebhookEvent(eventId);
      toast({ title: response.message });
      await loadData();
    } catch (error) {
      const friendly = getFriendlyError(error, {
        fallbackTitle: 'Webhook окуясын кайра иштетүү мүмкүн болгон жок',
      });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            WhatsApp каналы
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tenant админи Meta идентификаторлорун жана жеткиликтүүлүк токенин ушул жерден башкарат.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={isLoading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Жаңыртуу
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            WhatsApp жөндөөлөрү жүктөлүүдө...
          </div>
        ) : (
          <>
            {unavailableMessage ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {unavailableMessage}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Статус</p>
                <div className="mt-2">
                  <Badge variant={getStatusVariant(settings?.status)}>
                    {formatWhatsAppStatus(settings?.status)}
                  </Badge>
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Активдүү сүйлөшүүлөр</p>
                <p className="mt-2 text-lg font-semibold">{stats?.active ?? 0}</p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Окулбаган билдирүү</p>
                <p className="mt-2 text-lg font-semibold">{stats?.unreadCount ?? 0}</p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Катага түшкөн webhook</p>
                <p className="mt-2 text-lg font-semibold">{failedEvents.length}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>WhatsApp Business Account ID</Label>
                <Input
                  value={form.whatsapp_business_account_id}
                  onChange={(event) => handleChange('whatsapp_business_account_id', event.target.value)}
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number ID</Label>
                <Input
                  value={form.phone_number_id}
                  onChange={(event) => handleChange('phone_number_id', event.target.value)}
                  placeholder="10987654321"
                  disabled={Boolean(settings)}
                />
              </div>
              <div className="space-y-2">
                <Label>Көрүнүүчү номер</Label>
                <Input
                  value={form.display_phone_number}
                  onChange={(event) => handleChange('display_phone_number', event.target.value)}
                  placeholder="+996 500 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label>{settings ? 'Жаңы access token' : 'Access token'}</Label>
                <Input
                  value={form.access_token}
                  onChange={(event) => handleChange('access_token', event.target.value)}
                  placeholder={settings?.access_token_preview || 'EAAG...'}
                  type="password"
                />
                {settings?.access_token_preview ? (
                  <p className="text-xs text-muted-foreground">
                    Сакталган токен: {settings.access_token_preview}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <Plug className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">Туташуу жана webhook саламаттыгы</p>
                  <p className="text-muted-foreground">
                    Акыркы текшерүү: {formatDateTime(settings?.last_verified_at || null)}
                  </p>
                  <p className="text-muted-foreground">
                    Акыркы билдирүү активдүүлүгү: {formatDateTime(latestConversation?.last_message_at || latestConversation?.updated_at || null)}
                  </p>
                  <p className="text-muted-foreground">
                    Акыркы катталган ката: {failedEvents[0]?.error_message || 'Катталган эмес'}
                  </p>
                </div>
              </div>
            </div>

            {failedEvents.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Акыркы webhook каталары</p>
                {failedEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-red-200 bg-red-50/70 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="destructive">{event.event_type}</Badge>
                      <Badge variant="outline">Retry: {event.retry_count}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-red-900">
                      {event.error_message || 'Кошумча ката сүрөттөмөсү жок'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-red-700">
                        {formatDateTime(event.created_at)}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => void handleRetryWebhookEvent(event.id)}>
                        Кайра иштетүү
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Токен толугу менен фронтендге кайтарылбайт. Бул бетте маскаланган көрүнүш жана операторго керек болгон
                  саламаттык абалы гана көрсөтүлөт.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {settings ? (
                <>
                  <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
                    {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Байланышты текшерүү
                  </Button>
                  <Button variant="destructive" onClick={handleDisable} disabled={isDisabling}>
                    {isDisabling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Өчүрүү
                  </Button>
                </>
              ) : null}
              <Button
                onClick={handleSave}
                disabled={
                  isSaving
                  || !form.whatsapp_business_account_id.trim()
                  || !form.display_phone_number.trim()
                  || (!settings && (!form.phone_number_id.trim() || !form.access_token.trim()))
                }
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {settings ? 'Жаңыртуу' : 'Туташтыруу'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
