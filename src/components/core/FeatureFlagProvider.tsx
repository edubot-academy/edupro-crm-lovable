import { createContext, useContext, ReactNode, useEffect, useState, useMemo, useCallback } from 'react';
import type { FeatureFlags } from '@/types';
import { featureFlagApi } from '@/api/feature-flag';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { featureFlagsFromModules } from '@/lib/tenant-bootstrap';

interface FeatureFlagContextValue {
  featureFlags: FeatureFlags;
  isFeatureEnabled: (flag: keyof FeatureFlags) => boolean;
  isLoading: boolean;
  refreshFlags: () => Promise<void>;
  allowedFeatures?: Partial<Record<keyof FeatureFlags, boolean>>;
  sources?: Partial<Record<keyof FeatureFlags, 'global' | 'plan' | 'override'>>;
}

const defaultFeatureFlags: FeatureFlags = {
  crm_enabled: true,
  lms_bridge_enabled: false,
  trial_lessons_enabled: false,
  retention_enabled: false,
  telegram_notifications_enabled: false,
  advanced_reports_enabled: false,
  payments_enabled: false,
  whatsapp_integration_enabled: false,
  custom_roles_enabled: false,
  custom_domain_enabled: false,
  ai_assist_enabled: false,
  ai_followup_drafts_enabled: false,
  ai_operator_guidance_enabled: false,
  ai_insight_persistence_enabled: false,
};

function getEnvironmentFeatureFlags(): Partial<FeatureFlags> {
  return {
    ...(import.meta.env.VITE_ENABLE_CRM !== undefined && { crm_enabled: import.meta.env.VITE_ENABLE_CRM !== 'false' }),
    ...(import.meta.env.VITE_ENABLE_LMS_BRIDGE !== undefined && { lms_bridge_enabled: import.meta.env.VITE_ENABLE_LMS_BRIDGE === 'true' }),
    ...(import.meta.env.VITE_ENABLE_TRIAL_LESSONS !== undefined && { trial_lessons_enabled: import.meta.env.VITE_ENABLE_TRIAL_LESSONS === 'true' }),
    ...(import.meta.env.VITE_ENABLE_RETENTION !== undefined && { retention_enabled: import.meta.env.VITE_ENABLE_RETENTION === 'true' }),
    ...(import.meta.env.VITE_ENABLE_TELEGRAM !== undefined && { telegram_notifications_enabled: import.meta.env.VITE_ENABLE_TELEGRAM === 'true' }),
    ...(import.meta.env.VITE_ENABLE_ADVANCED_REPORTS !== undefined && { advanced_reports_enabled: import.meta.env.VITE_ENABLE_ADVANCED_REPORTS === 'true' }),
    ...(import.meta.env.VITE_ENABLE_AI_ASSIST !== undefined && { ai_assist_enabled: import.meta.env.VITE_ENABLE_AI_ASSIST === 'true' }),
    ...(import.meta.env.VITE_ENABLE_AI_DRAFTS !== undefined && { ai_followup_drafts_enabled: import.meta.env.VITE_ENABLE_AI_DRAFTS === 'true' }),
  };
}

function normalizeFeatureFlags(flags?: Partial<FeatureFlags>): FeatureFlags {
  return {
    ...defaultFeatureFlags,
    ...flags,
  };
}

function buildFallbackFeatureFlags(...sources: Array<Partial<FeatureFlags> | undefined>): FeatureFlags {
  return normalizeFeatureFlags(Object.assign({}, ...sources, getEnvironmentFeatureFlags()));
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  featureFlags: defaultFeatureFlags,
  isFeatureEnabled: () => false,
  isLoading: false,
  refreshFlags: async () => { },
  allowedFeatures: undefined,
  sources: undefined,
});

/**
 * Feature Flag Provider
 * 
 * This component provides context for feature flags across the application.
 * It allows modules to be enabled/disabled based on tenant configuration or product plan.
 * 
 * Feature Flag Precedence (highest to lowest):
 * 1. Backend API values (loaded on mount, override everything)
 * 2. Environment variables (used as fallback during initial load and if backend fails)
 * 3. Default values (hardcoded fallbacks)
 * 
 * @param children - Child components that may use feature flags
 * @param featureFlags - Optional feature flags configuration (defaults to environment variables)
 */
export function FeatureFlagProvider({
  children,
  featureFlags: initialFeatureFlags
}: {
  children: ReactNode;
  featureFlags?: Partial<FeatureFlags>
}) {
  const { tenantBranding } = useTenant();
  const bootstrapFeatureFlags = useMemo(
    () => tenantBranding.featureFlags || featureFlagsFromModules(tenantBranding.modules),
    [tenantBranding.featureFlags, tenantBranding.modules],
  );
  const fallbackFeatureFlags = useMemo(
    () => buildFallbackFeatureFlags(initialFeatureFlags, bootstrapFeatureFlags),
    [bootstrapFeatureFlags, initialFeatureFlags],
  );
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(fallbackFeatureFlags);
  const [allowedFeatures, setAllowedFeatures] = useState<Partial<Record<keyof FeatureFlags, boolean>>>();
  const [sources, setSources] = useState<Partial<Record<keyof FeatureFlags, 'global' | 'plan' | 'override'>>>();
  const [isLoading, setIsLoading] = useState(true); // Start as loading to prevent UI flicker

  useEffect(() => {
    setFeatureFlags(fallbackFeatureFlags);
  }, [fallbackFeatureFlags]);

  const loadFeatureFlags = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await featureFlagApi.getTenantFlags();
      setFeatureFlags(normalizeFeatureFlags(response));
      setAllowedFeatures(response.allowedFeatures);
      setSources(response.sources);
    } catch (error) {
      console.error('Failed to load feature flags from backend, using fail-closed fallback:', error);
      setFeatureFlags(fallbackFeatureFlags);
      setAllowedFeatures(undefined);
      setSources(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [fallbackFeatureFlags]);

  // Only load feature flags when user is authenticated
  const { isAuthenticated, tenantId } = useAuth();
  useEffect(() => {
    if (isAuthenticated) {
      loadFeatureFlags();
    } else {
      setFeatureFlags(fallbackFeatureFlags);
      setAllowedFeatures(undefined);
      setSources(undefined);
      setIsLoading(false);
    }
  }, [fallbackFeatureFlags, isAuthenticated, loadFeatureFlags, tenantId]);

  const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
    return featureFlags[flag] ?? false;
  };

  const contextValue: FeatureFlagContextValue = {
    featureFlags,
    isFeatureEnabled,
    isLoading,
    refreshFlags: loadFeatureFlags,
    allowedFeatures,
    sources,
  };

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to access feature flags
 * @returns Object with featureFlags and isFeatureEnabled function
 */
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  return context;
}
