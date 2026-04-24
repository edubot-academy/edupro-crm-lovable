import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { TenantConfig, TenantLeadSource } from '@/types';
import { tenantConfigApi } from '@/api/tenant-config';

interface TenantConfigContextValue {
  tenantConfig: TenantConfig;
  updateTenantConfig: (config: Partial<TenantConfig>) => void;
  isLoading: boolean;
}

const defaultTenantConfig: TenantConfig = {
  tenantId: 'default',
  language: 'ky',
  currency: 'KGS',
  timezone: 'Asia/Bishkek',
  companyName: 'EduPro CRM',
  leadSources: [
    { tenantId: 'default', sourceKey: 'instagram', sourceName: 'Instagram', isDefault: true },
    { tenantId: 'default', sourceKey: 'telegram', sourceName: 'Telegram', isDefault: true },
    { tenantId: 'default', sourceKey: 'whatsapp', sourceName: 'WhatsApp', isDefault: false },
    { tenantId: 'default', sourceKey: 'website', sourceName: 'Website', isDefault: true },
    { tenantId: 'default', sourceKey: 'phone_call', sourceName: 'Phone Call', isDefault: false },
    { tenantId: 'default', sourceKey: 'referral', sourceName: 'Referral', isDefault: false },
  ],
  paymentMethods: ['card', 'qr', 'bank', 'manual'],
  notificationChannels: [
    { id: '1', type: 'email', enabled: true },
    { id: '2', type: 'telegram', enabled: true },
  ],
  pipelineStages: [],
  roles: [],
};

const TenantConfigContext = createContext<TenantConfigContextValue>({
  tenantConfig: defaultTenantConfig,
  updateTenantConfig: () => { },
  isLoading: false,
});

/**
 * Tenant Configuration Provider
 * 
 * This component provides context for tenant-specific configuration.
 * It allows the application to be customized per tenant for currency,
 * branding, lead sources, payment methods, notification channels,
 * pipeline stages, and roles.
 * 
 * @param children - Child components that may use tenant configuration
 * @param initialConfig - Optional initial tenant configuration
 */
export function TenantConfigProvider({
  children,
  initialConfig
}: {
  children: ReactNode;
  initialConfig?: Partial<TenantConfig>
}) {
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>({
    ...defaultTenantConfig,
    ...initialConfig,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load tenant config from API on mount
  useEffect(() => {
    const loadTenantConfig = async () => {
      setIsLoading(true);
      try {
        const [config, leadSources, roles, pipelineStages, notificationChannels] = await Promise.all([
          tenantConfigApi.getConfig(),
          tenantConfigApi.getLeadSources(),
          tenantConfigApi.getRoles(),
          tenantConfigApi.getPipelineStages(),
          tenantConfigApi.getNotificationChannels(),
        ]);
        setTenantConfig({
          tenantId: config.tenantId,
          language: config.language,
          currency: config.currency,
          timezone: config.timezone,
          companyName: config.companyName || undefined,
          logoUrl: config.logoUrl || undefined,
          primaryColor: config.primaryColor || undefined,
          branding: {
            companyName: config.companyName || undefined,
            logoUrl: config.logoUrl || undefined,
            primaryColor: config.primaryColor || undefined,
          },
          leadSources: leadSources.map(ls => ({
            id: ls.id,
            tenantId: ls.tenantId,
            sourceKey: ls.sourceKey,
            sourceName: ls.sourceName,
            isDefault: ls.isDefault,
          })),
          paymentMethods: ['card', 'qr', 'bank', 'manual'], // TODO: Load from backend when payment methods endpoint is available
          notificationChannels: notificationChannels.map(nc => ({
            id: String(nc.id),
            type: nc.channelType as any,
            enabled: nc.enabled,
            config: nc.config,
          })),
          pipelineStages: pipelineStages.map(ps => ({
            id: String(ps.id),
            key: ps.stageKey,
            label: ps.stageName,
            order: ps.stageOrder,
          })),
          roles: roles.map(r => ({
            id: String(r.id),
            key: r.roleKey,
            label: r.roleName,
            permissions: Object.keys(r.permissions || {}),
          })),
          createdAt: new Date(config.createdAt),
          updatedAt: new Date(config.updatedAt),
        });
      } catch (error) {
        console.error('Failed to load tenant config from backend, using defaults:', error);
        // Keep using defaults
      } finally {
        setIsLoading(false);
      }
    };
    loadTenantConfig();
  }, []);

  const updateTenantConfig = async (config: Partial<TenantConfig>) => {
    const previousState = tenantConfig;
    setTenantConfig((prev) => ({ ...prev, ...config }));
    try {
      // Convert to backend format (Date -> string)
      const backendConfig: any = {
        ...config,
        createdAt: config.createdAt?.toISOString(),
        updatedAt: config.updatedAt?.toISOString(),
      };
      await tenantConfigApi.updateConfig(backendConfig);
    } catch (error) {
      console.error('Failed to persist tenant config to backend:', error);
      // Revert to previous state
      setTenantConfig(previousState);
      // Rethrow error so caller can handle it
      throw error;
    }
  };

  const contextValue: TenantConfigContextValue = {
    tenantConfig,
    updateTenantConfig,
    isLoading,
  };

  return (
    <TenantConfigContext.Provider value={contextValue}>
      {children}
    </TenantConfigContext.Provider>
  );
}

/**
 * Hook to access tenant configuration
 * @returns Object with tenantConfig, updateTenantConfig, and isLoading
 */
export function useTenantConfig() {
  const context = useContext(TenantConfigContext);
  return context;
}
