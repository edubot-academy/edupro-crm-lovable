/**
 * Formatting utilities that respect tenant configuration
 * 
 * These functions use tenant config for language, currency, and timezone
 * instead of hardcoded values, making the application truly multi-tenant.
 */

import { useTenantConfig } from '@/components/core/TenantConfigProvider';

/**
 * Format a date using tenant-configured locale and timezone
 */
export function useDateFormatter() {
  const { tenantConfig } = useTenantConfig();
  
  const locale = tenantConfig.language || 'ky';
  const timezone = tenantConfig.timezone || 'Asia/Bishkek';

  return {
    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString(locale, {
        ...options,
        timeZone: timezone,
      });
    },
    formatDateTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleString(locale, {
        dateStyle: 'short',
        timeStyle: 'short',
        ...options,
        timeZone: timezone,
      });
    },
    formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleTimeString(locale, {
        ...options,
        timeZone: timezone,
      });
    },
  };
}

/**
 * Format a number as currency using tenant-configured currency
 */
export function useCurrencyFormatter() {
  const { tenantConfig } = useTenantConfig();
  
  const currency = tenantConfig.currency || 'KGS';
  const locale = tenantConfig.language || 'ky';

  return {
    formatCurrency: (amount: number, options?: Intl.NumberFormatOptions) => {
      return amount.toLocaleString(locale, {
        style: 'currency',
        currency,
        ...options,
      });
    },
    formatNumber: (amount: number, options?: Intl.NumberFormatOptions) => {
      return amount.toLocaleString(locale, options);
    },
  };
}

/**
 * Non-hook versions for use outside React components
 * These use the current tenant config from the provider
 */
let currentLocale = 'ky';
let currentCurrency = 'KGS';
let currentTimezone = 'Asia/Bishkek';

export function setFormattingConfig(locale: string, currency: string, timezone: string) {
  currentLocale = locale;
  currentCurrency = currency;
  currentTimezone = timezone;
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(currentLocale, {
    ...options,
    timeZone: currentTimezone,
  });
}

export function formatDateTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(currentLocale, {
    dateStyle: 'short',
    timeStyle: 'short',
    ...options,
    timeZone: currentTimezone,
  });
}

export function formatCurrency(amount: number, options?: Intl.NumberFormatOptions): string {
  return amount.toLocaleString(currentLocale, {
    style: 'currency',
    currency: currentCurrency,
    ...options,
  });
}

export function formatNumber(amount: number, options?: Intl.NumberFormatOptions): string {
  return amount.toLocaleString(currentLocale, options);
}
