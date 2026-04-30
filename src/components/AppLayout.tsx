import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ky } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useTenantBranding } from '@/hooks/use-tenant-branding';
import { notificationsApi } from '@/api/modules';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const tenantBranding = useTenantBranding();
  const [unreadCount, setUnreadCount] = useState(0);

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbs: Array<{ label: string; href: string; isLast?: boolean }> = [{ label: ky.nav.dashboard, href: '/' }];

    if (pathnames.length > 0) {
      let currentPath = '';
      pathnames.forEach((name, index) => {
        currentPath += `/${name}`;
        const isLast = index === pathnames.length - 1;
        const previousSegment = pathnames[index - 1];

        const labelMap: Record<string, string> = {
          leads: ky.nav.leads,
          contacts: ky.nav.contacts,
          deals: ky.nav.deals,
          pipeline: ky.nav.pipeline,
          'trial-lessons': ky.nav.trialLessons,
          courses: ky.nav.courses,
          payments: ky.nav.payments,
          enrollments: ky.nav.enrollments,
          tasks: ky.nav.tasks,
          timeline: ky.nav.timeline,
          retention: ky.nav.retention,
          reports: ky.nav.reports,
          notifications: ky.nav.notifications,
          users: ky.nav.users,
          settings: ky.nav.settings,
        };

        let label = labelMap[name] || name;

        if (/^\d+$/.test(name)) {
          if (previousSegment === 'leads') label = 'Лид маалыматы';
          if (previousSegment === 'contacts') label = 'Байланыш маалыматы';
          if (previousSegment === 'deals') label = 'Келишим маалыматы';
        }

        if (name === 'create') {
          label = ky.common.create;
        }

        breadcrumbs.push({ label, href: currentPath, isLast });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const currentPageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || ky.nav.dashboard;

  const handleQuickCreate = () => {
    const currentPath = location.pathname;
    if (currentPath === '/leads' || currentPath.startsWith('/leads')) {
      navigate('/leads?create=1');
    } else if (currentPath === '/contacts' || currentPath.startsWith('/contacts')) {
      navigate('/contacts?create=1');
    } else if (currentPath === '/deals' || currentPath.startsWith('/deals')) {
      navigate('/deals?create=1');
    } else if (currentPath === '/tasks' || currentPath.startsWith('/tasks')) {
      navigate('/tasks?create=1');
    } else {
      navigate('/leads?create=1');
    }
  };

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

  useEffect(() => {
    document.title = `${tenantBranding.displayName} | ${currentPageTitle}`;
  }, [currentPageTitle, tenantBranding.displayName]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground shrink-0" />
              {breadcrumbs.length > 1 && (
                <Breadcrumb className="hidden md:flex">
                  <BreadcrumbList>
                    {breadcrumbs.map((crumb) => (
                      <React.Fragment key={crumb.href}>
                        <BreadcrumbItem>
                          {crumb.isLast ? (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link to={crumb.href}>{crumb.label}</Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!crumb.isLast && <BreadcrumbSeparator />}
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
              <div className="hidden xl:block min-w-0">
                <p className="truncate text-sm font-semibold">{tenantBranding.displayName}</p>
                {tenantBranding.primaryDomain && (
                  <p className="truncate text-xs text-muted-foreground">{tenantBranding.primaryDomain}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleQuickCreate}
                title="Тез кошуу"
                aria-label="Тез кошуу"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/notifications')}
                title={ky.nav.notifications}
                aria-label={ky.nav.notifications}
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
