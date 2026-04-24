import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { FeatureFlags } from '@/types';
import { featureFlagApi } from '@/api/feature-flag';

interface FeatureFlagContextValue {
  featureFlags: FeatureFlags;
  isFeatureEnabled: (flag: keyof FeatureFlags) => boolean;
  isLoading: boolean;
  refreshFlags: () => Promise<void>;
}

const defaultFeatureFlags: FeatureFlags = {
  crm_enabled: true,
  lms_bridge_enabled: false,
  trial_lessons_enabled: true,
  retention_enabled: true,
  telegram_notifications_enabled: true,
  advanced_reports_enabled: true,
};

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  featureFlags: defaultFeatureFlags,
  isFeatureEnabled: () => false,
  isLoading: false,
  refreshFlags: async () => { },
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
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    ...defaultFeatureFlags,
    ...initialFeatureFlags,
    // Override with environment variables if set
    crm_enabled: import.meta.env.VITE_ENABLE_CRM !== 'false',
    lms_bridge_enabled: import.meta.env.VITE_ENABLE_LMS_BRIDGE === 'true',
    trial_lessons_enabled: import.meta.env.VITE_ENABLE_TRIAL_LESSONS !== 'false',
    retention_enabled: import.meta.env.VITE_ENABLE_RETENTION !== 'false',
    telegram_notifications_enabled: import.meta.env.VITE_ENABLE_TELEGRAM !== 'false',
    advanced_reports_enabled: import.meta.env.VITE_ENABLE_ADVANCED_REPORTS !== 'false',
  });
  const [isLoading, setIsLoading] = useState(true); // Start as loading to prevent UI flicker

  const loadFeatureFlags = async () => {
    setIsLoading(true);
    try {
      const flags = await featureFlagApi.getTenantFlags();
      setFeatureFlags(flags);
    } catch (error) {
      console.error('Failed to load feature flags from backend, using defaults:', error);
      // Keep using environment variable defaults
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
    return featureFlags[flag] ?? false;
  };

  const contextValue: FeatureFlagContextValue = {
    featureFlags,
    isFeatureEnabled,
    isLoading,
    refreshFlags: loadFeatureFlags,
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
