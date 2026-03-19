import {
  LayoutDashboard, Users, UserCheck, Handshake, GitBranch,
  GraduationCap, CreditCard, CheckSquare, MessageSquare,
  AlertTriangle, BarChart3, Bell, Settings, UserCog, LogOut, BookOpen, Database,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { ky } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const mainNav = [
  { title: ky.nav.dashboard, url: '/', icon: LayoutDashboard },
  { title: ky.nav.leads, url: '/leads', icon: Users },
  { title: ky.nav.contacts, url: '/contacts', icon: UserCheck },
  { title: ky.nav.deals, url: '/deals', icon: Handshake },
  { title: ky.nav.pipeline, url: '/pipeline', icon: GitBranch },
  { title: ky.nav.trialLessons, url: '/trial-lessons', icon: GraduationCap },
];

const operationsNav = [
  { title: ky.nav.payments, url: '/payments', icon: CreditCard },
  { title: 'LMS Каттоо', url: '/enrollments', icon: BookOpen },
  { title: ky.nav.tasks, url: '/tasks', icon: CheckSquare },
  { title: ky.nav.timeline, url: '/timeline', icon: MessageSquare },
  { title: ky.nav.retention, url: '/retention', icon: AlertTriangle },
];

const systemNav = [
  { title: ky.nav.reports, url: '/reports', icon: BarChart3 },
  { title: ky.nav.notifications, url: '/notifications', icon: Bell },
  { title: ky.nav.users, url: '/users', icon: UserCog },
  { title: ky.nav.settings, url: '/settings', icon: Settings },
];

const legacyNav = [
  { title: ky.nav.legacyContacts, url: '/legacy-contacts', icon: Database },
];

function NavSection({
  label,
  items,
  collapsed,
  onNavigate,
}: {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === '/'}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                  onClick={onNavigate}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, logout } = useAuth();
  const isSystemAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const visibleSystemNav = systemNav.filter((item) => !['/users', '/reports', '/notifications', '/settings'].includes(item.url) || isSystemAdmin);
  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
          E
        </div>
        {!collapsed && (
          <span className="font-bold text-sidebar-accent-foreground tracking-tight">
            EduPro CRM
          </span>
        )}
      </div>

      <SidebarContent className="px-2 py-2">
        <NavSection label="Негизги" items={mainNav} collapsed={collapsed} onNavigate={handleNavigate} />
        <NavSection label="Операциялар" items={operationsNav} collapsed={collapsed} onNavigate={handleNavigate} />
        {isSuperAdmin && <NavSection label="Legacy Data" items={legacyNav} collapsed={collapsed} onNavigate={handleNavigate} />}
        <NavSection label="Система" items={visibleSystemNav} collapsed={collapsed} onNavigate={handleNavigate} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
            {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user?.fullName || user?.email}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className="shrink-0 text-sidebar-foreground/50 hover:text-sidebar-accent-foreground transition-colors" title={ky.nav.logout}>
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
