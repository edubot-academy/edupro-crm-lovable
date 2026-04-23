import { createContext, useContext, ReactNode } from 'react';

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
 * @param enableLmsBridge - Feature flag to enable/disable LMS bridge components
 */
export function LmsBridgeProvider({ children, enableLmsBridge = false }: { children: ReactNode; enableLmsBridge?: boolean }) {
  const contextValue: LmsBridgeContextValue = {
    isLmsBridgeEnabled: enableLmsBridge ?? false,
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
