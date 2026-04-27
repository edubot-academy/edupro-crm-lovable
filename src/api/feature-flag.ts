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

export interface TenantFeatureFlagsResponse extends Record<FeatureFlagKey, boolean> {
  // Optional: Platform-provided allowed features based on tenant plan/package
  allowedFeatures?: Partial<Record<FeatureFlagKey, boolean>>;
  // Optional: Source of feature control (platform | tenant)
  sources?: Partial<Record<FeatureFlagKey, 'platform' | 'tenant'>>;
}

// Don't use localStorage - the API client handles X-Company-Id automatically from AuthContext

export const featureFlagApi = {
  // Get all feature flags for current tenant
  // Uses new endpoint: /feature-flags/tenant
  getTenantFlags: async (): Promise<TenantFeatureFlagsResponse> => {
    try {
      return await apiClient.get<TenantFeatureFlagsResponse>('/feature-flags/tenant');
    } catch (error) {
      // TODO: Remove legacy /feature-flag/tenant fallback after staging verification.
      if (import.meta.env.DEV) {
        console.warn('Feature flag: Falling back to legacy endpoint /feature-flag/tenant. This is temporary for migration.');
      }
      try {
        // Fallback to legacy endpoint during migration
        return await apiClient.get<TenantFeatureFlagsResponse>('/feature-flag/tenant');
      } catch (legacyError) {
        console.error('Failed to load feature flags from legacy endpoint as well');
        throw new Error('Unable to load feature flags. Please check your connection and try again.');
      }
    }
  },

  // Set a tenant-specific feature flag override
  // Uses new endpoint: /feature-flags/tenant
  // WARNING: Do NOT use this method for platform-controlled module flags:
  // - lms_bridge_enabled
  // - trial_lessons_enabled
  // - retention_enabled
  // - advanced_reports_enabled
  // - telegram_notifications_enabled
  // - crm_enabled
  // These flags are controlled by Platform Admin plan/package configuration.
  // This method is reserved for future tenant-owned feature flags only.
  setTenantFlag: async (key: FeatureFlagKey, enabled: boolean): Promise<void> => {
    try {
      return await apiClient.post<void>('/feature-flags/tenant', { key, enabled });
    } catch (error: any) {
      // Handle 400 errors from backend with Kyrgyz message
      if (error?.status === 400) {
        const message = error?.message || error?.details || 'Бул функция платформа тарифи аркылуу башкарылат';
        throw new Error(message);
      }
      // TODO: Remove legacy /feature-flag/tenant fallback after staging verification.
      if (import.meta.env.DEV) {
        console.warn('Feature flag: Falling back to legacy endpoint /feature-flag/tenant. This is temporary for migration.');
      }
      try {
        // Fallback to legacy endpoint during migration
        return await apiClient.post<void>('/feature-flag/tenant', { key, enabled });
      } catch (legacyError: any) {
        console.error('Failed to set feature flag with legacy endpoint as well');
        throw new Error('Unable to update feature flag. Please check your connection and try again.');
      }
    }
  },
};
