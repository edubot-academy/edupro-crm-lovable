import { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import type { TenantConfig } from '@/types';
import { tenantConfigApi, type TenantConfigUpdatePayload } from '@/api/tenant-config';
import { setFormattingConfig } from '@/lib/formatting';
import { useAuth } from '@/contexts/AuthContext';

interface TenantConfigContextValue {
  tenantConfig: TenantConfig;
  updateTenantConfig: (config: TenantConfigUpdatePayload) => Promise<void>;
  refreshTenantConfig: () => Promise<void>;
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
  updateTenantConfig: async () => {},
  refreshTenantConfig: async () => {},
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
  const initialTenantConfig = useMemo<TenantConfig>(() => ({
    ...defaultTenantConfig,
    ...initialConfig,
  }), [initialConfig]);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>(initialTenantConfig);
  const [isLoading, setIsLoading] = useState(false);

  // Load tenant config from API when authenticated
  const { isAuthenticated, tenantId } = useAuth();
  const loadTenantConfig = useCallback(async () => {
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
          supportEmail: config.supportEmail || undefined,
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
    }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadTenantConfig();
    } else {
      setTenantConfig(initialTenantConfig);
      setFormattingConfig(
        initialTenantConfig.language,
        initialTenantConfig.currency,
        initialTenantConfig.timezone,
      );
      setIsLoading(false);
    }
  }, [initialTenantConfig, isAuthenticated, tenantId, loadTenantConfig]);

  const updateTenantConfig = async (config: TenantConfigUpdatePayload) => {
    const previousState = tenantConfig;
    setTenantConfig((prev) => ({ ...prev, ...config }));
    try {
      // Convert to backend format (Date -> string)
      const backendConfig: TenantConfigUpdatePayload = {
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
    refreshTenantConfig: loadTenantConfig,
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
// eslint-disable-next-line react-refresh/only-export-components
export function useTenantConfig() {
  const context = useContext(TenantConfigContext);
  return context;
}
