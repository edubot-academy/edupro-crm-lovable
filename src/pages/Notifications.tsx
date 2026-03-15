import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ky } from '@/lib/i18n';
import { Bell, Send, Link2, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { notificationsApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [isLinked, setIsLinked] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    notificationsApi.getTelegramStatus()
      .then((res) => setIsLinked(res.linked))
      .catch(() => {})
      .finally(() => setIsLoadingStatus(false));
  }, []);

  const handleGetLink = async () => {
    setIsLoadingLink(true);
    try {
      const res = await notificationsApi.getTelegramLink();
      setLinkUrl(res.url);
    } catch {
      toast({ title: 'Шилтеме алууда ката кетти', variant: 'destructive' });
    } finally {
      setIsLoadingLink(false);
    }
  };

  const handleTestMessage = async () => {
    setIsSendingTest(true);
    try {
      await notificationsApi.sendTestMessage();
      toast({ title: 'Тест билдирүүсү жиберилди' });
    } catch {
      toast({ title: 'Тест билдирүүсүн жиберүүдө ката кетти', variant: 'destructive' });
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
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title={ky.notifications.title} />

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
    </div>
  );
}
