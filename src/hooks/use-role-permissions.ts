import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantConfig } from '@/components/core/TenantConfigProvider';
import type { UserRole } from '@/types';
import { useFeatureFlags } from '@/components/core/FeatureFlagProvider';

/**
 * Role hierarchy for permission checks
 * Higher roles inherit permissions from lower roles
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  sales: 1,
  assistant: 2,
  manager: 3,
  admin: 4,
  superadmin: 5,
};

/**
 * Role-based permissions configuration
 */
interface PermissionConfig {
  canAssignLeads: boolean;
  canViewAdminPanel: boolean;
  canViewIntegrationHistory: boolean;
  canViewStudentSummary: boolean;
  canViewTechnicalFields: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canViewRetentionCases: boolean;
  canManageRetentionCases: boolean;
  canViewBridgeAdmin: boolean;
  canManageBridge: boolean;
}

/**
 * Get permissions for a given role
 */
function getPermissionsForRole(role: UserRole): PermissionConfig {
  const level = ROLE_HIERARCHY[role];

  // Base permissions (available to all roles)
  const basePermissions: PermissionConfig = {
    canAssignLeads: false,
    canViewAdminPanel: false,
    canViewIntegrationHistory: false,
    canViewStudentSummary: false,
    canViewTechnicalFields: false,
    canManageUsers: false,
    canManageSettings: false,
    canViewRetentionCases: false,
    canManageRetentionCases: false,
    canViewBridgeAdmin: false,
    canManageBridge: false,
  };

  // Sales role - basic CRM access
  if (level >= ROLE_HIERARCHY.sales) {
    // Sales has base permissions only
  }

  // Assistant role - can view more CRM data
  if (level >= ROLE_HIERARCHY.assistant) {
    // Assistant has base permissions only for now
  }

  // Manager role - can view education data and manage retention
  if (level >= ROLE_HIERARCHY.manager) {
    basePermissions.canAssignLeads = true;
    basePermissions.canViewStudentSummary = true;
    basePermissions.canViewRetentionCases = true;
    basePermissions.canManageRetentionCases = true;
  }

  // Admin role - can access admin panel and manage users
  if (level >= ROLE_HIERARCHY.admin) {
    basePermissions.canViewAdminPanel = true;
    basePermissions.canViewIntegrationHistory = true;
    basePermissions.canViewTechnicalFields = true;
    basePermissions.canManageUsers = true;
    basePermissions.canManageSettings = true;
    basePermissions.canViewBridgeAdmin = true;
    basePermissions.canManageBridge = true;
  }

  // Superadmin role - full access
  if (level >= ROLE_HIERARCHY.superadmin) {
    // Inherits all admin permissions
  }

  return basePermissions;
}

/**
 * Check if a role has at least the minimum required level
 */
function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Hook for role-based permissions
 * Provides permission checks based on the current user's role
 * 
 * When tenant config is available, permissions are driven by tenant role definitions.
 * Falls back to hardcoded permissions for backward compatibility.
 */
export function useRolePermissions() {
  const { user } = useAuth();
  const { tenantConfig, isLoading: tenantConfigLoading } = useTenantConfig();
  const { isFeatureEnabled, isLoading: featureFlagsLoading } = useFeatureFlags();
  const userRole = user?.role;
  const customRolesEnabled = !featureFlagsLoading && isFeatureEnabled('custom_roles_enabled');

  const permissions = useMemo<PermissionConfig>(() => {
    if (!userRole) {
      // Return all false if no user/role
      return {
        canAssignLeads: false,
        canViewAdminPanel: false,
        canViewIntegrationHistory: false,
        canViewStudentSummary: false,
        canViewTechnicalFields: false,
        canManageUsers: false,
        canManageSettings: false,
        canViewRetentionCases: false,
        canManageRetentionCases: false,
        canViewBridgeAdmin: false,
        canManageBridge: false,
      };
    }

    // Preserve legacy role behavior unless tenant-custom roles are explicitly enabled.
    if (!customRolesEnabled) {
      return getPermissionsForRole(userRole);
    }

    // Try to use tenant-configured role permissions if available
    const tenantRole = tenantConfig.roles.find(r => r.key === userRole);
    if (tenantRole && tenantRole.permissions && Object.keys(tenantRole.permissions).length > 0) {
      const perms = tenantRole.permissions;
      // Try both snake_case and camelCase key variants for compatibility
      const mappedPermissions = {
        canAssignLeads: !!perms['assign_leads'] || !!perms['assignLeads'],
        canViewAdminPanel: !!perms['view_admin_panel'] || !!perms['viewAdminPanel'],
        canViewIntegrationHistory: !!perms['view_integration_history'] || !!perms['viewIntegrationHistory'],
        canViewStudentSummary: !!perms['view_student_summary'] || !!perms['viewStudentSummary'],
        canViewTechnicalFields: !!perms['view_technical_fields'] || !!perms['viewTechnicalFields'],
        canManageUsers: !!perms['manage_users'] || !!perms['manageUsers'],
        canManageSettings: !!perms['manage_settings'] || !!perms['manageSettings'],
        canViewRetentionCases: !!perms['view_retention_cases'] || !!perms['viewRetentionCases'],
        canManageRetentionCases: !!perms['manage_retention_cases'] || !!perms['manageRetentionCases'],
        canViewBridgeAdmin: !!perms['view_bridge_admin'] || !!perms['viewBridgeAdmin'],
        canManageBridge: !!perms['manage_bridge'] || !!perms['manageBridge'],
      };
      // Tenant permissions are authoritative when configured, even if all are false
      // This allows tenants to restrict access below baked-in defaults
      return mappedPermissions;
    }

    // Fallback to hardcoded permissions only when tenant permissions are not configured
    return getPermissionsForRole(userRole);
  }, [customRolesEnabled, tenantConfig.roles, userRole]);

  /**
   * Check if current user has a specific role level
   */
  const hasRole = (minimumRole: UserRole): boolean => {
    if (!userRole) return false;
    return hasMinimumRole(userRole, minimumRole);
  };

  /**
   * Check if current user is one of the specified roles
   */
  const isOneOf = (roles: UserRole[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  /**
   * Check if current user can view LMS technical fields
   * (external IDs, webhook data, integration states)
   */
  const canViewLmsTechnicalFields = (): boolean => {
    return permissions.canViewTechnicalFields;
  };

  /**
   * Check if current user can assign leads to sales staff
   */
  const canAssignLeads = (): boolean => {
    return permissions.canAssignLeads;
  };

  /**
   * Check if current user can view integration history
   */
  const canViewIntegrationHistory = (): boolean => {
    return permissions.canViewIntegrationHistory;
  };

  /**
   * Check if current user can view student summary
   */
  const canViewStudentSummary = (): boolean => {
    return permissions.canViewStudentSummary;
  };

  /**
   * Check if current user can access admin panel
   */
  const canAccessAdminPanel = (): boolean => {
    return permissions.canViewAdminPanel;
  };

  /**
   * Check if current user can manage users
   */
  const canManageUsers = (): boolean => {
    return permissions.canManageUsers;
  };

  /**
   * Check if current user can manage settings
   */
  const canManageSettings = (): boolean => {
    return permissions.canManageSettings;
  };

  /**
   * Check if current user can view retention cases
   */
  const canViewRetentionCases = (): boolean => {
    return permissions.canViewRetentionCases;
  };

  /**
   * Check if current user can manage retention cases
   */
  const canManageRetentionCases = (): boolean => {
    return permissions.canManageRetentionCases;
  };

  /**
   * Check if current user can view bridge admin
   */
  const canViewBridgeAdmin = (): boolean => {
    return permissions.canViewBridgeAdmin;
  };

  /**
   * Check if current user can manage bridge
   */
  const canManageBridge = (): boolean => {
    return permissions.canManageBridge;
  };

  return {
    isLoading: tenantConfigLoading || featureFlagsLoading,
    isUsingTenantPermissions: customRolesEnabled,
    userRole,
    permissions,
    hasRole,
    isOneOf,
    canAssignLeads,
    canViewLmsTechnicalFields,
    canViewIntegrationHistory,
    canViewStudentSummary,
    canAccessAdminPanel,
    canManageUsers,
    canManageSettings,
    canViewRetentionCases,
    canManageRetentionCases,
    canViewBridgeAdmin,
    canManageBridge,
  };
}
