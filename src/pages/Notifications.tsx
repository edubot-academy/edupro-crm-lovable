import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ky } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Bell, Send, Link2, CheckCircle, Loader2, ExternalLink, CreditCard, GraduationCap } from 'lucide-react';
import { notificationsApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { InAppNotification } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NotificationsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSystemAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [activeTab, setActiveTab] = useState<'all' | 'approvals'>('all');
  const [isLinked, setIsLinked] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'approvals') {
      return notifications.filter(
        (n) => n.type === 'payment_pending_approval' || n.type === 'enrollment_pending_approval'
      );
    }
    return notifications;
  }, [notifications, activeTab]);

  const approvalCount = useMemo(
    () => notifications.filter((n) => n.type === 'payment_pending_approval' || n.type === 'enrollment_pending_approval').length,
    [notifications]
  );

  const fetchInAppNotifications = () => {
    setIsLoadingNotifications(true);
    notificationsApi.listInApp({ page: 1, limit: 30 })
      .then((res) => setNotifications(res.items))
      .catch(() => setNotifications([]))
      .finally(() => setIsLoadingNotifications(false));
  };

  useEffect(() => {
    fetchInAppNotifications();
  }, []);

  useEffect(() => {
    if (!isSystemAdmin) {
      setIsLoadingStatus(false);
      return;
    }

    notificationsApi.getTelegramStatus()
      .then((res) => setIsLinked(res.linked))
      .catch(() => {
        setIsLinked(false);
      })
      .finally(() => setIsLoadingStatus(false));
  }, [isSystemAdmin]);

  const handleGetLink = async () => {
    setIsLoadingLink(true);
    try {
      const res = await notificationsApi.getTelegramLink();
      setLinkUrl(res.url);
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Telegram шилтемесин алуу ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsLoadingLink(false);
    }
  };

  const handleTestMessage = async () => {
    setIsSendingTest(true);
    try {
      await notificationsApi.sendTestMessage();
      toast({ title: 'Тест билдирүүсү жиберилди' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Тест билдирүүсүн жиберүү ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const refreshStatus = async () => {
    try {
      const res = await notificationsApi.getTelegramStatus();
      setIsLinked(res.linked);
      if (res.linked) {
        toast({ title: 'Telegram ийгиликтүү байланыштырылды!' });
        setLinkUrl('');
      }
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Telegram статусун жаңыртуу ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    }
  };

  const handleOpenNotification = async (notification: InAppNotification) => {
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications((prev) => prev.map((item) => (
          item.id === notification.id ? { ...item, isRead: true } : item
        )));
        window.dispatchEvent(new Event('crm-notifications-refresh'));
      } catch {
        // best effort
      }
    }

    if (notification.linkUrl) {
      navigate(notification.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      window.dispatchEvent(new Event('crm-notifications-refresh'));
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Билдирүүлөрдү жаңыртуу ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title={ky.notifications.title} />

      <Card className="shadow-card border-border/50">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold">CRM билдирүүлөрү</h3>
            </div>
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={isMarkingAllRead || notifications.every((item) => item.isRead)}>
              {isMarkingAllRead && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Баарын окулду кылуу
            </Button>
          </div>

          {isSystemAdmin && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'approvals')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">Бардыгы ({notifications.length})</TabsTrigger>
                <TabsTrigger value="approvals">
                  Бекитүү күтүү ({approvalCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {isLoadingNotifications ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filteredNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {activeTab === 'approvals' ? 'Бекитүү күтүүчү билдирүүлөр жок.' : 'CRM ичинде билдирүү жок.'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const isApproval = notification.type === 'payment_pending_approval' || notification.type === 'enrollment_pending_approval';
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleOpenNotification(notification)}
                    className={cn(
                      'w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/40',
                      isApproval && 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {notification.type === 'payment_pending_approval' && <CreditCard className="h-4 w-4 text-amber-600" />}
                          {notification.type === 'enrollment_pending_approval' && <GraduationCap className="h-4 w-4 text-amber-600" />}
                          <p className={cn('text-sm', isApproval ? 'font-semibold' : 'font-medium')}>
                            {notification.title || 'CRM билдирүү'}
                          </p>
                          {!notification.isRead && <Badge variant="destructive">Жаңы</Badge>}
                          {isApproval && <Badge variant="outline" className="text-amber-600 border-amber-200">Бекитүү</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.content || 'Кошумча маалымат жок'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString('ky-KG', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isSystemAdmin && (
        <Card className="shadow-card border-border/50">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold">Telegram билдирүүлөрү</h3>
            </div>

            {isLoadingStatus ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Статус:</span>
                  {isLinked ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                      <CheckCircle className="h-4 w-4" /> Байланыштырылган
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-warning">Байланыштырыла элек</span>
                  )}
                </div>

                {/* Actions */}
                {!isLinked && (
                  <div className="space-y-3">
                    {!linkUrl ? (
                      <Button onClick={handleGetLink} disabled={isLoadingLink} variant="outline">
                        {isLoadingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                        Telegram шилтемесин алуу
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                          <ExternalLink className="h-4 w-4" /> Telegram ботту ачуу
                        </a>
                        <p className="text-xs text-muted-foreground">Ботту ачып, /start басыңыз, анан "Статусту жаңыртуу" баскычын басыңыз.</p>
                        <Button onClick={refreshStatus} variant="outline" size="sm">Статусту жаңыртуу</Button>
                      </div>
                    )}
                  </div>
                )}

                {isLinked && (
                  <Button onClick={handleTestMessage} disabled={isSendingTest} variant="outline">
                    {isSendingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Тест билдирүү жиберүү
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
