import { createContext, useContext, ReactNode } from 'react';
import { useFeatureFlags } from '@/components/core/FeatureFlagProvider';

interface LmsBridgeContextValue {
  isLmsBridgeEnabled: boolean;
}

const LmsBridgeContext = createContext<LmsBridgeContextValue>({
  isLmsBridgeEnabled: false,
});

/**
 * LMS Bridge Provider
 *
 * This component provides context for LMS bridge functionality.
 * It allows the CRM to function without LMS by providing optional
 * LMS-specific data through bridge components.
 *
 * @param children - Child components that may use LMS bridge features
 */
export function LmsBridgeProvider({ children }: { children: ReactNode }) {
  const { isFeatureEnabled } = useFeatureFlags();
  const contextValue: LmsBridgeContextValue = {
    isLmsBridgeEnabled: isFeatureEnabled('lms_bridge_enabled'),
  };

  return (
    <LmsBridgeContext.Provider value={contextValue}>
      {children}
    </LmsBridgeContext.Provider>
  );
}

/**
 * Hook to access LMS bridge context
 * @returns Object with isLmsBridgeEnabled flag
 */
export function useLmsBridge() {
  const context = useContext(LmsBridgeContext);
  return context;
}
