import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tenantResolveApi, type TenantResolveResponse } from '@/api/tenant-resolve';
import { ky } from '@/lib/i18n';

interface TenantContextType {
  tenant: TenantResolveResponse | null;
  isLoading: boolean;
  isProductionDomain: boolean;
  error: string | null;
  resolveTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Check if hostname is localhost/127.0.0.1 for dev mode
function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('127.0.0.');
}

// Check if hostname is a production tenant domain
function isProductionTenantDomain(hostname: string): boolean {
  // Production tenant domains follow pattern: {slug}-crm.{domain}
  // Domain pattern can be configured via environment variable
  const domainPattern = import.meta.env.VITE_TENANT_DOMAIN_PATTERN || '.edubot.it.com';
  // Exclude platform/admin domains
  const platformDomains = [
    `crm${domainPattern}`,
    `admin.crm${domainPattern}`,
  ];
  if (platformDomains.includes(hostname)) {
    return false;
  }
  // Any other subdomain matching the pattern is considered a tenant domain
  return hostname.endsWith(domainPattern);
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantResolveResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProductionDomain, setIsProductionDomain] = useState(false);

  const resolveTenant = useCallback(async () => {
    const hostname = window.location.hostname;

    // Localhost/dev: don't auto-resolve, allow manual tenant ID
    if (isLocalhost(hostname)) {
      setIsProductionDomain(false);
      setTenant(null);
      setError(null);
      return;
    }

    // Production tenant domain: resolve from hostname
    if (isProductionTenantDomain(hostname)) {
      setIsProductionDomain(true);
      setIsLoading(true);
      setError(null);

      try {
        const resolved = await tenantResolveApi.resolveByDomain(hostname);
        setTenant(resolved);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);

        // Map backend error messages to Kyrgyz UI text
        if (message.includes('Тенант домени табылган жок')) {
          setError(ky.auth.tenantDomainNotFound);
        } else if (message.includes('Бул тенант учурда активдүү эмес')) {
          setError(ky.auth.tenantNotActive);
        } else {
          setError(ky.auth.crmAccessDenied);
        }

        setTenant(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Platform/admin domain or unknown domain
      setIsProductionDomain(false);
      setTenant(null);
      setError(null);
    }
  }, []);

  // Resolve tenant on mount
  useEffect(() => {
    resolveTenant();
  }, [resolveTenant]);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, isProductionDomain, error, resolveTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}
