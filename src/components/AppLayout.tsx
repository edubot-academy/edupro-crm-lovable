import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ky } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { notificationsApi } from '@/api/modules';

export function AppLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const fetchUnreadCount = () => {
      notificationsApi.getUnreadCount()
        .then((res) => {
          if (!cancelled) setUnreadCount(res.count);
        })
        .catch(() => {
          if (!cancelled) setUnreadCount(0);
        });
    };

    fetchUnreadCount();
    const intervalId = window.setInterval(fetchUnreadCount, 60_000);
    window.addEventListener('crm-notifications-refresh', fetchUnreadCount);

    return () => {
      cancelled = true;
      window.removeEventListener('crm-notifications-refresh', fetchUnreadCount);
      window.clearInterval(intervalId);
    };
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/notifications')}
                title={ky.nav.notifications}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-destructive px-1 text-[10px] font-semibold leading-5 text-destructive-foreground">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
