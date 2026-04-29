import { apiClient } from './client';

export interface TenantResolveResponse {
  tenantId: number;
  name: string;
  slug: string;
  primaryDomain: string | null;
  status: string;
  brandingName: string | null;
  brandingLogoUrl: string | null;
}

export const tenantResolveApi = {
  /** GET /public/tenant-resolve?domain={hostname} — resolves tenant from domain (pre-login branding only) */
  resolveByDomain: (domain: string) =>
    apiClient.get<TenantResolveResponse>('/public/tenant-resolve', { domain }),
};
