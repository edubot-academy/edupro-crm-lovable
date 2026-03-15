import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

import LoginPage from "./pages/Login";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import AcceptInvitePage from "./pages/AcceptInvite";
import DashboardPage from "./pages/Dashboard";
import LeadsPage from "./pages/Leads";
import LeadDetailPage from "./pages/LeadDetail";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/trial-lessons" element={<TrialLessonsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/enrollments" element={<EnrollmentsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/retention" element={<RetentionPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
