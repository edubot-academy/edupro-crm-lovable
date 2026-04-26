import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { TenantConfig } from '@/types';
import { tenantConfigApi } from '@/api/tenant-config';
import { setFormattingConfig } from '@/lib/formatting';
import { useAuth } from '@/contexts/AuthContext';

interface TenantConfigContextValue {
  tenantConfig: TenantConfig;
  updateTenantConfig: (config: Partial<TenantConfig>) => void;
  isLoading: boolean;
}

const defaultTenantConfig: TenantConfig = {
  tenantId: '',
  language: 'ky',
  currency: 'KGS',
  timezone: 'Asia/Bishkek',
  companyName: '',
  leadSources: [],
  paymentMethods: [],
  notificationChannels: [],
  pipelineStages: [],
  leadStatuses: [],
  dealStatuses: [],
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

  // Load tenant config from API when authenticated
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    const loadTenantConfig = async () => {
      setIsLoading(true);
      try {
        const [config, leadSources, roles, pipelineStages, notificationChannels, leadStatuses, dealStatuses, paymentMethods] = await Promise.all([
          tenantConfigApi.getConfig(),
          tenantConfigApi.getLeadSources(),
          tenantConfigApi.getRoles(),
          tenantConfigApi.getPipelineStages(),
          tenantConfigApi.getNotificationChannels(),
          tenantConfigApi.getStatuses('lead'),
          tenantConfigApi.getStatuses('deal'),
          tenantConfigApi.getPaymentMethods(),
        ]);
        const loadedConfig: TenantConfig = {
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
          leadSources: leadSources.map(s => ({
            id: s.id,
            tenantId: s.tenantId,
            sourceKey: s.sourceKey,
            sourceName: s.sourceName,
            isDefault: s.isDefault,
          })),
          roles: roles.map(r => ({
            id: String(r.id),
            key: r.roleKey,
            label: r.roleName,
            permissions: (r.permissions || {}) as Record<string, boolean>,
          })),
          pipelineStages: pipelineStages.map(s => ({
            id: String(s.id),
            key: s.stageKey,
            label: s.stageName,
            order: s.stageOrder,
          })),
          leadStatuses: leadStatuses.map(s => ({
            id: String(s.id),
            key: s.statusKey,
            label: s.statusName,
            order: s.statusOrder,
            entityType: s.entityType,
          })),
          dealStatuses: dealStatuses.map(s => ({
            id: String(s.id),
            key: s.statusKey,
            label: s.statusName,
            order: s.statusOrder,
            entityType: s.entityType,
          })),
          notificationChannels: notificationChannels.map(n => ({
            id: String(n.id),
            type: n.channelType as 'email' | 'telegram' | 'sms' | 'whatsapp',
            config: n.config,
            enabled: n.enabled,
          })),
          paymentMethods: paymentMethods.map(p => ({
            id: p.id,
            tenantId: p.tenantId,
            methodKey: p.methodKey,
            methodName: p.methodName,
            methodType: p.methodType,
            config: p.config,
            enabled: p.enabled,
            displayOrder: p.displayOrder,
          })),
          createdAt: new Date(config.createdAt),
          updatedAt: new Date(config.updatedAt),
        };
        setTenantConfig(loadedConfig);
        // Update formatting utilities with tenant config
        setFormattingConfig(config.language, config.currency, config.timezone);
      } catch (error) {
        console.error('Failed to load tenant config from backend, using defaults:', error);
        // Keep using defaults
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadTenantConfig();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

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
