import { useTenant } from '@/contexts/TenantContext';
import { useTenantConfig } from '@/components/core/TenantConfigProvider';
import { normalizeTenantBootstrap } from '@/lib/tenant-bootstrap';

export function useTenantBranding() {
  const { tenant, tenantBranding } = useTenant();
  const { tenantConfig } = useTenantConfig();

  return normalizeTenantBootstrap({
    resolvedTenant: tenant,
    tenantConfig,
    authBootstrap: {
      tenantId: tenantBranding.tenantId,
      supportEmail: tenantBranding.supportEmail,
      supportPhone: tenantBranding.supportPhone,
      planCode: tenantBranding.planCode,
      modules: tenantBranding.modules,
      features: tenantBranding.featureFlags,
    },
  });
}
