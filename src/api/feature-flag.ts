import { apiClient } from './client';

export type FeatureFlagKey = 'crm_enabled' | 'lms_bridge_enabled' | 'trial_lessons_enabled' | 'retention_enabled' | 'telegram_notifications_enabled' | 'advanced_reports_enabled';

export interface FeatureFlagResponse {
  id: number;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantFeatureFlagResponse {
  id: number;
  tenantId: string;
  featureKey: string;
  enabled: boolean;
}

// Don't use localStorage - the API client handles X-Company-Id automatically from AuthContext

export const featureFlagApi = {
  // Get all feature flags for current tenant
  // Uses new endpoint: /feature-flags/tenant
  getTenantFlags: async (): Promise<Record<FeatureFlagKey, boolean>> => {
    try {
      return await apiClient.get<Record<FeatureFlagKey, boolean>>('/feature-flags/tenant');
    } catch (error) {
      // TODO: Remove legacy /feature-flag/tenant fallback after staging verification.
      if (import.meta.env.DEV) {
        console.warn('Feature flag: Falling back to legacy endpoint /feature-flag/tenant. This is temporary for migration.');
      }
      try {
        // Fallback to legacy endpoint during migration
        return await apiClient.get<Record<FeatureFlagKey, boolean>>('/feature-flag/tenant');
      } catch (legacyError) {
        console.error('Failed to load feature flags from legacy endpoint as well');
        throw new Error('Unable to load feature flags. Please check your connection and try again.');
      }
    }
  },

  // Set a tenant-specific feature flag override
  // Uses new endpoint: /feature-flags/tenant
  setTenantFlag: async (key: FeatureFlagKey, enabled: boolean): Promise<void> => {
    try {
      return await apiClient.post<void>('/feature-flags/tenant', { key, enabled });
    } catch (error) {
      // TODO: Remove legacy /feature-flag/tenant fallback after staging verification.
      if (import.meta.env.DEV) {
        console.warn('Feature flag: Falling back to legacy endpoint /feature-flag/tenant. This is temporary for migration.');
      }
      try {
        // Fallback to legacy endpoint during migration
        return await apiClient.post<void>('/feature-flag/tenant', { key, enabled });
      } catch (legacyError) {
        console.error('Failed to set feature flag with legacy endpoint as well');
        throw new Error('Unable to update feature flag. Please check your connection and try again.');
      }
    }
  },
};
