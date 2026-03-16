import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ky } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';

export function AppLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSystemAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2">
              {isSystemAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/notifications')}
                  title={ky.nav.notifications}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
                </Button>
              )}
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
