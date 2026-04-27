import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleGuard } from "@/components/ModuleGuard";
import { AppLayout } from "@/components/AppLayout";
import { LmsBridgeProvider } from "@/components/lms/LmsBridgeProvider";
import { FeatureFlagProvider, useFeatureFlags } from "@/components/core/FeatureFlagProvider";
import { TenantConfigProvider } from "@/components/core/TenantConfigProvider";
import { useRolePermissions } from "@/hooks/use-role-permissions";

import LoginPage from "./pages/Login";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import AcceptInvitePage from "./pages/AcceptInvite";
import DashboardPage from "./pages/Dashboard";
import LeadsPage from "./pages/Leads";
import CoursesPage from "./pages/Courses";
import LeadDetailPage from "./pages/LeadDetail";
import DealDetailPage from "./pages/DealDetail";
import ContactsPage from "./pages/Contacts";
import ContactDetailPage from "./pages/ContactDetail";
import DealsPage from "./pages/Deals";
import PipelinePage from "./pages/Pipeline";
import TrialLessonsPage from "./pages/TrialLessons";
import PaymentsPage from "./pages/Payments";
import TasksPage from "./pages/Tasks";
import TimelinePage from "./pages/Timeline";
import RetentionPage from "./pages/Retention";
import ReportsPage from "./pages/Reports";
import NotificationsPage from "./pages/Notifications";
import UsersPage from "./pages/Users";
import SettingsPage from "./pages/Settings";
import EnrollmentsPage from "./pages/Enrollments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();
  const { canViewLmsTechnicalFields, canViewRetentionCases, canAccessAdminPanel, canManageUsers, canManageSettings } = useRolePermissions();

  return (
    <LmsBridgeProvider>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
        <Route path="/forgot-password" element={<AuthRedirect><ForgotPasswordPage /></AuthRedirect>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactDetailPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/deals/:id" element={<DealDetailPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* LMS-dependent routes - protected by feature flag and role permissions */}
          <Route
            path="/courses"
            element={
              <ModuleGuard
                requiredFeature="lms_bridge_enabled"
                permissionCheck={canViewLmsTechnicalFields}
              >
                <CoursesPage />
              </ModuleGuard>
            }
          />

          <Route
            path="/trial-lessons"
            element={
              <ModuleGuard
                requiredFeature="trial_lessons_enabled"
              >
                <TrialLessonsPage />
              </ModuleGuard>
            }
          />

          <Route
            path="/enrollments"
            element={
              <ModuleGuard
                requiredFeature="lms_bridge_enabled"
                permissionCheck={canViewLmsTechnicalFields}
              >
                <EnrollmentsPage />
              </ModuleGuard>
            }
          />

          <Route
            path="/retention"
            element={
              <ModuleGuard
                requiredFeature="retention_enabled"
                permissionCheck={canViewRetentionCases}
              >
                <RetentionPage />
              </ModuleGuard>
            }
          />

          {/* Admin routes - protected by permission checks and feature flags */}
          <Route
            path="/reports"
            element={
              <ModuleGuard
                requiredFeature="advanced_reports_enabled"
                permissionCheck={canAccessAdminPanel}
              >
                <ReportsPage />
              </ModuleGuard>
            }
          />

          <Route
            path="/users"
            element={
              <ModuleGuard permissionCheck={canManageUsers}>
                <UsersPage />
              </ModuleGuard>
            }
          />

          <Route
            path="/settings"
            element={
              <ModuleGuard permissionCheck={canManageSettings}>
                <SettingsPage />
              </ModuleGuard>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </LmsBridgeProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TenantProvider>
          <AuthProvider>
            <TenantConfigProvider>
              <FeatureFlagProvider>
                <AppContent />
              </FeatureFlagProvider>
            </TenantConfigProvider>
          </AuthProvider>
        </TenantProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
