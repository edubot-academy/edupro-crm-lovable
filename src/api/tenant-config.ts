import { apiClient } from './client';
import type { TenantConfig, TenantLeadSource, RoleConfig, PipelineStageConfig, NotificationChannel } from '@/types';

export interface TenantConfigResponse {
  id: number;
  tenantId: string;
  language: string;
  currency: string;
  timezone: string;
  companyName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantLeadSourceResponse {
  id: number;
  tenantId: string;
  sourceKey: string;
  sourceName: string;
  isDefault: boolean;
}

export interface TenantRoleResponse {
  id: number;
  tenantId: string;
  roleKey: string;
  roleName: string;
  permissions: Record<string, any>;
}

export interface TenantPipelineStageResponse {
  id: number;
  tenantId: string;
  stageKey: string;
  stageName: string;
  stageOrder: number;
  isDefault: boolean;
}

export interface TenantStatusResponse {
  id: number;
  tenantId: string;
  entityType: string;
  statusKey: string;
  statusName: string;
  statusOrder: number;
  isDefault: boolean;
}

export interface TenantNotificationChannelResponse {
  id: number;
  tenantId: string;
  channelType: string;
  config: Record<string, any>;
  enabled: boolean;
}

export interface TenantPaymentMethodResponse {
  id: number;
  tenantId: string;
  methodKey: string;
  methodName: string;
  methodType: 'card' | 'qr' | 'bank' | 'manual' | 'other';
  config: Record<string, any>;
  enabled: boolean;
  displayOrder: number;
}

// Don't use localStorage - the API client handles X-Company-Id automatically from AuthContext

export const tenantConfigApi = {
  // Main Config
  getConfig: async (): Promise<TenantConfigResponse> => {
    return apiClient.get<TenantConfigResponse>('/tenant-config');
  },

  updateConfig: async (updates: Partial<TenantConfigResponse>): Promise<TenantConfigResponse> => {
    return apiClient.put<TenantConfigResponse>('/tenant-config', updates);
  },

  // Lead Sources
  getLeadSources: async (): Promise<TenantLeadSourceResponse[]> => {
    return apiClient.get<TenantLeadSourceResponse[]>('/tenant-config/lead-sources');
  },

  createLeadSource: async (data: { sourceKey: string; sourceName: string; isDefault?: boolean }): Promise<TenantLeadSourceResponse> => {
    return apiClient.post<TenantLeadSourceResponse>('/tenant-config/lead-sources', data);
  },

  updateLeadSource: async (sourceKey: string, updates: Partial<TenantLeadSourceResponse>): Promise<TenantLeadSourceResponse> => {
    return apiClient.put<TenantLeadSourceResponse>(`/tenant-config/lead-sources/${sourceKey}`, updates);
  },

  deleteLeadSource: async (sourceKey: string): Promise<void> => {
    return apiClient.delete<void>(`/tenant-config/lead-sources/${sourceKey}`);
  },

  // Roles
  getRoles: async (): Promise<TenantRoleResponse[]> => {
    return apiClient.get<TenantRoleResponse[]>('/tenant-config/roles');
  },

  createRole: async (data: { roleKey: string; roleName: string; permissions?: Record<string, any> }): Promise<TenantRoleResponse> => {
    return apiClient.post<TenantRoleResponse>('/tenant-config/roles', data);
  },

  updateRole: async (roleKey: string, updates: Partial<TenantRoleResponse>): Promise<TenantRoleResponse> => {
    return apiClient.put<TenantRoleResponse>(`/tenant-config/roles/${roleKey}`, updates);
  },

  deleteRole: async (roleKey: string): Promise<void> => {
    return apiClient.delete<void>(`/tenant-config/roles/${roleKey}`);
  },

  // Pipeline Stages
  getPipelineStages: async (): Promise<TenantPipelineStageResponse[]> => {
    return apiClient.get<TenantPipelineStageResponse[]>('/tenant-config/stages');
  },

  createPipelineStage: async (data: { stageKey: string; stageName: string; stageOrder: number; isDefault?: boolean }): Promise<TenantPipelineStageResponse> => {
    return apiClient.post<TenantPipelineStageResponse>('/tenant-config/stages', data);
  },

  updatePipelineStage: async (stageKey: string, updates: Partial<TenantPipelineStageResponse>): Promise<TenantPipelineStageResponse> => {
    return apiClient.put<TenantPipelineStageResponse>(`/tenant-config/stages/${stageKey}`, updates);
  },

  deletePipelineStage: async (stageKey: string): Promise<void> => {
    return apiClient.delete<void>(`/tenant-config/stages/${stageKey}`);
  },

  // Statuses
  getStatuses: async (entityType: string): Promise<TenantStatusResponse[]> => {
    return apiClient.get<TenantStatusResponse[]>(`/tenant-config/statuses?entityType=${entityType}`);
  },

  createStatus: async (data: { entityType: string; statusKey: string; statusName: string; statusOrder: number; isDefault?: boolean }): Promise<TenantStatusResponse> => {
    return apiClient.post<TenantStatusResponse>('/tenant-config/statuses', data);
  },

  updateStatus: async (entityType: string, statusKey: string, updates: Partial<TenantStatusResponse>): Promise<TenantStatusResponse> => {
    return apiClient.put<TenantStatusResponse>(`/tenant-config/statuses/${entityType}/${statusKey}`, updates);
  },

  deleteStatus: async (entityType: string, statusKey: string): Promise<void> => {
    return apiClient.delete<void>(`/tenant-config/statuses/${entityType}/${statusKey}`);
  },

  // Notification Channels
  getNotificationChannels: async (): Promise<TenantNotificationChannelResponse[]> => {
    return apiClient.get<TenantNotificationChannelResponse[]>('/tenant-config/notification-channels');
  },

  createNotificationChannel: async (data: { channelType: string; config?: Record<string, any>; enabled?: boolean }): Promise<TenantNotificationChannelResponse> => {
    return apiClient.post<TenantNotificationChannelResponse>('/tenant-config/notification-channels', data);
  },

  updateNotificationChannel: async (channelType: string, updates: Partial<TenantNotificationChannelResponse>): Promise<TenantNotificationChannelResponse> => {
    return apiClient.put<TenantNotificationChannelResponse>(`/tenant-config/notification-channels/${channelType}`, updates);
  },

  deleteNotificationChannel: async (channelType: string): Promise<void> => {
    return apiClient.delete<void>(`/tenant-config/notification-channels/${channelType}`);
  },

  // Payment Methods
  getPaymentMethods: async (): Promise<TenantPaymentMethodResponse[]> => {
    return apiClient.get<TenantPaymentMethodResponse[]>('/tenant-config/payment-methods');
  },

  createPaymentMethod: async (data: { methodKey: string; methodName: string; methodType: 'card' | 'qr' | 'bank' | 'manual' | 'other'; config?: Record<string, any>; enabled?: boolean; displayOrder?: number }): Promise<TenantPaymentMethodResponse> => {
    return apiClient.post<TenantPaymentMethodResponse>('/tenant-config/payment-methods', data);
  },

  updatePaymentMethod: async (methodKey: string, updates: Partial<TenantPaymentMethodResponse>): Promise<TenantPaymentMethodResponse> => {
    return apiClient.put<TenantPaymentMethodResponse>(`/tenant-config/payment-methods/${methodKey}`, updates);
  },

  deletePaymentMethod: async (methodKey: string): Promise<void> => {
    return apiClient.delete<void>(`/tenant-config/payment-methods/${methodKey}`);
  },
};
