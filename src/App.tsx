import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleGuard } from "@/components/ModuleGuard";
import { Loader2 } from "lucide-react";
import { LmsBridgeProvider } from "@/components/lms/LmsBridgeProvider";
import { FeatureFlagProvider } from "@/components/core/FeatureFlagProvider";
import { TenantConfigProvider } from "@/components/core/TenantConfigProvider";
import { useRolePermissions } from "@/hooks/use-role-permissions";

const AppLayout = lazy(() => import("@/components/AppLayout").then((module) => ({ default: module.AppLayout })));
const LoginPage = lazy(() => import("./pages/Login"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPassword"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword"));
const AcceptInvitePage = lazy(() => import("./pages/AcceptInvite"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const LeadsPage = lazy(() => import("./pages/Leads"));
const CoursesPage = lazy(() => import("./pages/Courses"));
const LeadDetailPage = lazy(() => import("./pages/LeadDetail"));
const DealDetailPage = lazy(() => import("./pages/DealDetail"));
const ContactsPage = lazy(() => import("./pages/Contacts"));
const ContactDetailPage = lazy(() => import("./pages/ContactDetail"));
const DealsPage = lazy(() => import("./pages/Deals"));
const PipelinePage = lazy(() => import("./pages/Pipeline"));
const TrialLessonsPage = lazy(() => import("./pages/TrialLessons"));
const PaymentsPage = lazy(() => import("./pages/Payments"));
const TasksPage = lazy(() => import("./pages/Tasks"));
const TimelinePage = lazy(() => import("./pages/Timeline"));
const RetentionPage = lazy(() => import("./pages/Retention"));
const ReportsPage = lazy(() => import("./pages/Reports"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const UsersPage = lazy(() => import("./pages/Users"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const EnrollmentsPage = lazy(() => import("./pages/Enrollments"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function RouteLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { canViewLmsTechnicalFields, canViewRetentionCases, canAccessAdminPanel, canManageUsers, canManageSettings } = useRolePermissions();

  return (
    <LmsBridgeProvider>
      <Suspense fallback={<RouteLoadingState />}>
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
            <Route
              path="/payments"
              element={
                <ModuleGuard requiredFeature="payments_enabled">
                  <PaymentsPage />
                </ModuleGuard>
              }
            />
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
      </Suspense>
    </LmsBridgeProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <TenantProvider>
            <TenantConfigProvider>
              <FeatureFlagProvider>
                <AppContent />
              </FeatureFlagProvider>
            </TenantConfigProvider>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
