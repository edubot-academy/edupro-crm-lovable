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
  trial_lessons_enabled: false,
  retention_enabled: true,
  telegram_notifications_enabled: false,
  advanced_reports_enabled: false,
};

/**
 * CRM-only mode feature flag configuration
 * This configuration represents a pure CRM deployment without LMS integration
 *
 * To enable CRM-only mode:
 * 1. Set environment variable: VITE_ENABLE_LMS_BRIDGE=false
 * 2. Or configure tenant feature flags via backend API to match this configuration
 *
 * In CRM-only mode:
 * - LMS pages (/courses, /enrollments) are inaccessible and redirect to dashboard
 * - Trial lessons page is disabled
 * - LMS bridge components don't render
 * - LMS hooks don't run (no API calls to LMS)
 * - CRM core functionality remains fully operational
 */
export const CRM_ONLY_MODE_FLAGS: Partial<FeatureFlags> = {
  crm_enabled: true,
  lms_bridge_enabled: false,
  trial_lessons_enabled: false, // Trial lessons are education-specific
  retention_enabled: true, // Retention is useful for CRM-only businesses
  telegram_notifications_enabled: true,
  advanced_reports_enabled: true,
};

/**
 * CRM+LMS bundled mode feature flag configuration
 * This configuration represents the full bundled product with LMS integration
 *
 * To enable CRM+LMS bundled mode:
 * 1. Set environment variable: VITE_ENABLE_LMS_BRIDGE=true
 * 2. Or configure tenant feature flags via backend API to match this configuration
 *
 * In CRM+LMS bundled mode:
 * - All LMS pages are accessible to authorized users
 * - Trial lessons are enabled
 * - LMS bridge components render where appropriate
 * - LMS hooks run and fetch data from LMS
 * - Full CRM and LMS integration is operational
 */
export const CRM_LMS_BUNDLE_MODE_FLAGS: Partial<FeatureFlags> = {
  crm_enabled: true,
  lms_bridge_enabled: true,
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
    // Only override with environment variables if explicitly set
    ...(import.meta.env.VITE_ENABLE_CRM !== undefined && { crm_enabled: import.meta.env.VITE_ENABLE_CRM !== 'false' }),
    ...(import.meta.env.VITE_ENABLE_LMS_BRIDGE !== undefined && { lms_bridge_enabled: import.meta.env.VITE_ENABLE_LMS_BRIDGE === 'true' }),
    ...(import.meta.env.VITE_ENABLE_TRIAL_LESSONS !== undefined && { trial_lessons_enabled: import.meta.env.VITE_ENABLE_TRIAL_LESSONS === 'true' }),
    ...(import.meta.env.VITE_ENABLE_RETENTION !== undefined && { retention_enabled: import.meta.env.VITE_ENABLE_RETENTION === 'true' }),
    ...(import.meta.env.VITE_ENABLE_TELEGRAM !== undefined && { telegram_notifications_enabled: import.meta.env.VITE_ENABLE_TELEGRAM === 'true' }),
    ...(import.meta.env.VITE_ENABLE_ADVANCED_REPORTS !== undefined && { advanced_reports_enabled: import.meta.env.VITE_ENABLE_ADVANCED_REPORTS === 'true' }),
  });
  const [isLoading, setIsLoading] = useState(true); // Start as loading to prevent UI flicker

  const loadFeatureFlags = async () => {
    setIsLoading(true);
    try {
      const flags = await featureFlagApi.getTenantFlags();
      setFeatureFlags(flags);
    } catch (error) {
      console.error('Failed to load feature flags from backend, using defaults:', error);
      // Keep using conservative defaults (environment variables only if explicitly set)
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
