import { Navigate } from 'react-router-dom';
import { useFeatureFlags } from '@/components/core/FeatureFlagProvider';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { Loader2 } from 'lucide-react';

interface ModuleGuardProps {
  children: React.ReactNode;
  /**
   * Feature flag key that must be enabled for this route
   */
  requiredFeature?: keyof import('@/types').FeatureFlags;
  /**
   * Permission check function that must return true for this route
   */
  permissionCheck?: () => boolean;
  /**
   * Redirect path when access is denied (defaults to '/')
   */
  redirectPath?: string;
}

/**
 * ModuleGuard - Route-level protection for feature-flagged and permission-gated modules
 * 
 * This component ensures that:
 * - Disabled modules cannot be reached by URL directly (not just hidden in sidebar)
 * - LMS-dependent pages are protected by both feature flags and role permissions
 * - Trial/retention/admin pages have proper guards
 * 
 * Usage:
 * <ModuleGuard requiredFeature="lms_bridge_enabled" permissionCheck={() => canViewLmsTechnicalFields()}>
 *   <CoursesPage />
 * </ModuleGuard>
 */
export function ModuleGuard({
  children,
  requiredFeature,
  permissionCheck,
  redirectPath = '/',
}: ModuleGuardProps) {
  const { isFeatureEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const permissionCheckResult = permissionCheck?.() ?? true;

  // Show loading state while feature flags are being fetched
  if (flagsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if required feature is enabled
  if (requiredFeature && !isFeatureEnabled(requiredFeature)) {
    return <Navigate to={redirectPath} replace />;
  }

  // Check if user has required permission
  if (!permissionCheckResult) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
