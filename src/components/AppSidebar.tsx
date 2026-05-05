import {
  LayoutDashboard, Users, UserCheck, Handshake, GitBranch,
  GraduationCap, CreditCard, CheckSquare, MessageSquare,
  AlertTriangle, BarChart3, Bell, Settings, UserCog, LogOut,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useFeatureFlags } from '@/components/core/FeatureFlagProvider';
import { ky } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useTenantBranding } from '@/hooks/use-tenant-branding';
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
  { title: ky.nav.enrollments, url: '/enrollments', icon: GraduationCap },
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
  const tenantBranding = useTenantBranding();
  const { canViewRetentionCases, canManageUsers, canManageSettings, canAccessAdminPanel } = useRolePermissions();
  const { isFeatureEnabled } = useFeatureFlags();

  const brandingName = tenantBranding.displayName;
  const firstChar = brandingName.charAt(0) || 'E';

  // Filter mainNav based on LMS permissions and feature flags
  const visibleMainNav = mainNav.filter((item) => {
    if (item.url === '/trial-lessons' && !isFeatureEnabled('trial_lessons_enabled')) return false;
    return true;
  });

  // Filter operationsNav based on permissions and feature flags
  const visibleOperationsNav = operationsNav.filter((item) => {
    if (item.url === '/payments' && !isFeatureEnabled('payments_enabled')) return false;
    if (item.url === '/enrollments' && !isFeatureEnabled('lms_bridge_enabled')) return false;
    if (item.url === '/retention' && !canViewRetentionCases()) return false;
    if (item.url === '/retention' && !isFeatureEnabled('retention_enabled')) return false;
    return true;
  });

  // Filter systemNav based on admin permissions and feature flags
  const visibleSystemNav = systemNav.filter((item) => {
    if (item.url === '/users' && !canManageUsers()) return false;
    if (item.url === '/reports' && !canAccessAdminPanel()) return false;
    if (item.url === '/reports' && !isFeatureEnabled('advanced_reports_enabled')) return false;
    if (item.url === '/settings' && !canManageSettings()) return false;
    return true;
  });

  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        {tenantBranding.logoUrl ? (
          <img src={tenantBranding.logoUrl} alt={brandingName} className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
            {firstChar}
          </div>
        )}
        {!collapsed && (
          <span className="font-bold text-sidebar-accent-foreground tracking-tight">
            {brandingName}
          </span>
        )}
      </div>

      <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2">
        <NavSection label="Негизги" items={visibleMainNav} collapsed={collapsed} onNavigate={handleNavigate} />
        <NavSection label="Операциялар" items={visibleOperationsNav} collapsed={collapsed} onNavigate={handleNavigate} />
        <NavSection label="Система" items={visibleSystemNav} collapsed={collapsed} onNavigate={handleNavigate} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
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
            <button onClick={logout} className="shrink-0 text-sidebar-foreground/50 hover:text-sidebar-accent-foreground transition-colors" title={ky.nav.logout} aria-label={ky.nav.logout}>
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
