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

const getCompanyId = () => localStorage.getItem('companyId') || undefined;

export const tenantConfigApi = {
  // Main Config
  getConfig: async (): Promise<TenantConfigResponse> => {
    return apiClient.get<TenantConfigResponse>('/tenant-config', undefined, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  updateConfig: async (updates: Partial<TenantConfigResponse>): Promise<TenantConfigResponse> => {
    return apiClient.put<TenantConfigResponse>('/tenant-config', updates, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  // Lead Sources
  getLeadSources: async (): Promise<TenantLeadSourceResponse[]> => {
    return apiClient.get<TenantLeadSourceResponse[]>('/tenant-config/lead-sources', undefined, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  createLeadSource: async (data: { sourceKey: string; sourceName: string; isDefault?: boolean }): Promise<TenantLeadSourceResponse> => {
    return apiClient.post<TenantLeadSourceResponse>('/tenant-config/lead-sources', data, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  updateLeadSource: async (sourceKey: string, updates: Partial<TenantLeadSourceResponse>): Promise<TenantLeadSourceResponse> => {
    return apiClient.put<TenantLeadSourceResponse>(`/tenant-config/lead-sources/${sourceKey}`, updates, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  deleteLeadSource: async (sourceKey: string): Promise<void> => {
    return apiClient.delete<void>(`/tenant-config/lead-sources/${sourceKey}`, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  // Roles
  getRoles: async (): Promise<TenantRoleResponse[]> => {
    return apiClient.get<TenantRoleResponse[]>('/tenant-config/roles', undefined, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  createRole: async (data: { roleKey: string; roleName: string; permissions?: Record<string, any> }): Promise<TenantRoleResponse> => {
    return apiClient.post<TenantRoleResponse>('/tenant-config/roles', data, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  updateRole: async (roleKey: string, updates: Partial<TenantRoleResponse>): Promise<TenantRoleResponse> => {
    return apiClient.put<TenantRoleResponse>(`/tenant-config/roles/${roleKey}`, updates, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  deleteRole: async (roleKey: string): Promise<void> => {
    return apiClient.delete<void>(`/tenant-config/roles/${roleKey}`, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  // Pipeline Stages
  getPipelineStages: async (): Promise<TenantPipelineStageResponse[]> => {
    return apiClient.get<TenantPipelineStageResponse[]>('/tenant-config/stages', undefined, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  createPipelineStage: async (data: { stageKey: string; stageName: string; stageOrder: number; isDefault?: boolean }): Promise<TenantPipelineStageResponse> => {
    return apiClient.post<TenantPipelineStageResponse>('/tenant-config/stages', data, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  updatePipelineStage: async (stageKey: string, updates: Partial<TenantPipelineStageResponse>): Promise<TenantPipelineStageResponse> => {
    return apiClient.put<TenantPipelineStageResponse>(`/tenant-config/stages/${stageKey}`, updates, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  deletePipelineStage: async (stageKey: string): Promise<void> => {
    return apiClient.delete<void>(`/tenant-config/stages/${stageKey}`, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  // Statuses
  getStatuses: async (entityType: string): Promise<TenantStatusResponse[]> => {
    return apiClient.get<TenantStatusResponse[]>(`/tenant-config/statuses?entityType=${entityType}`, undefined, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  createStatus: async (data: { entityType: string; statusKey: string; statusName: string; statusOrder: number; isDefault?: boolean }): Promise<TenantStatusResponse> => {
    return apiClient.post<TenantStatusResponse>('/tenant-config/statuses', data, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  updateStatus: async (entityType: string, statusKey: string, updates: Partial<TenantStatusResponse>): Promise<TenantStatusResponse> => {
    return apiClient.put<TenantStatusResponse>(`/tenant-config/statuses/${entityType}/${statusKey}`, updates, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  deleteStatus: async (entityType: string, statusKey: string): Promise<void> => {
    return apiClient.delete<void>(`/tenant-config/statuses/${entityType}/${statusKey}`, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  // Notification Channels
  getNotificationChannels: async (): Promise<TenantNotificationChannelResponse[]> => {
    return apiClient.get<TenantNotificationChannelResponse[]>('/tenant-config/notification-channels', undefined, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  createNotificationChannel: async (data: { channelType: string; config?: Record<string, any>; enabled?: boolean }): Promise<TenantNotificationChannelResponse> => {
    return apiClient.post<TenantNotificationChannelResponse>('/tenant-config/notification-channels', data, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  updateNotificationChannel: async (channelType: string, updates: Partial<TenantNotificationChannelResponse>): Promise<TenantNotificationChannelResponse> => {
    return apiClient.put<TenantNotificationChannelResponse>(`/tenant-config/notification-channels/${channelType}`, updates, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },

  deleteNotificationChannel: async (channelType: string): Promise<void> => {
    return apiClient.delete<void>(`/tenant-config/notification-channels/${channelType}`, {
      extraHeaders: getCompanyId() ? { 'x-company-id': getCompanyId()! } : undefined,
    });
  },
};
