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
  getTenantFlags: async (): Promise<Record<FeatureFlagKey, boolean>> => {
    try {
      return await apiClient.get<Record<FeatureFlagKey, boolean>>('/feature-flag/tenant');
    } catch (error) {
      console.error('Failed to load feature flags, using defaults');
      throw error;
    }
  },

  // Set a tenant-specific feature flag override
  setTenantFlag: async (key: FeatureFlagKey, enabled: boolean): Promise<void> => {
    return apiClient.post<void>('/feature-flag/tenant', { key, enabled });
  },

  // Get all global feature flags
  getGlobalFlags: async (): Promise<FeatureFlagResponse[]> => {
    return apiClient.get<FeatureFlagResponse[]>('/feature-flag/global');
  },

  // Set a global feature flag (admin only)
  setGlobalFlag: async (key: FeatureFlagKey, enabled: boolean): Promise<void> => {
    return apiClient.put<void>(`/feature-flag/global/${key}`, { enabled });
  },
};
