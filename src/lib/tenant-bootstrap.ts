import type { TenantConfig, FeatureFlags } from '@/types';
import type { TenantResolveResponse } from '@/api/tenant-resolve';
import { validateAndSanitizeTenantId } from '@/lib/validation';

export interface TenantBootstrapData {
  tenantId: string | null;
  tenantName: string | null;
  displayName: string;
  logoUrl: string | null;
  brandColor: string | null;
  primaryDomain: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  planCode: string | null;
  modules: string[];
  featureFlags?: Partial<FeatureFlags>;
  productName: string;
  supportLabel: string;
}

interface AuthBootstrapTenant {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  primaryDomain?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
}

interface AuthBootstrapPlan {
  id?: string | null;
  name?: string | null;
  code?: string | null;
}

type AuthBootstrapModules = string[] | Record<string, boolean> | null;

export interface AuthBootstrapResponse {
  user?: {
    id?: number;
    fullName?: string | null;
    email?: string | null;
    role?: string | null;
    isActive?: boolean;
    lastLoginAt?: string | Date | null;
  } | null;
  tenant?: AuthBootstrapTenant | null;
  plan?: AuthBootstrapPlan | null;
  tenantId?: string | number | null;
  name?: string | null;
  brandingName?: string | null;
  brandingLogoUrl?: string | null;
  brandingPrimaryColor?: string | null;
  primaryDomain?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  planCode?: string | null;
  modules?: AuthBootstrapModules;
  features?: Partial<FeatureFlags> | null;
  permissions?: string[] | null;
}

interface TenantBootstrapSources {
  resolvedTenant?: TenantResolveResponse | null;
  tenantConfig?: Partial<TenantConfig> | null;
  authBootstrap?: AuthBootstrapResponse | null;
}

const DEFAULT_PRODUCT_NAME = 'EduBot CRM';
const DEFAULT_SUPPORT_LABEL = 'Колдоо кызматы';

const MODULE_TO_FEATURE_FLAG: Partial<Record<string, keyof FeatureFlags>> = {
  crm: 'crm_enabled',
  leads: 'crm_enabled',
  contacts: 'crm_enabled',
  deals: 'crm_enabled',
  lms: 'lms_bridge_enabled',
  lms_bridge: 'lms_bridge_enabled',
  lms_integration: 'lms_bridge_enabled',
  trial_lessons: 'trial_lessons_enabled',
  enrollments: 'trial_lessons_enabled',
  retention: 'retention_enabled',
  reports: 'advanced_reports_enabled',
  advanced_reports: 'advanced_reports_enabled',
  telegram: 'telegram_notifications_enabled',
  telegram_notifications: 'telegram_notifications_enabled',
  payments: 'payments_enabled',
  whatsapp: 'whatsapp_integration_enabled',
  whatsapp_integration: 'whatsapp_integration_enabled',
  custom_roles: 'custom_roles_enabled',
  custom_domain: 'custom_domain_enabled',
};

function normalizeText(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeTenantId(value?: string | number | null): string | null {
  if (value === null || value === undefined) return null;
  const sanitized = validateAndSanitizeTenantId(String(value));
  return sanitized || null;
}

function normalizeModules(modules?: AuthBootstrapModules): string[] {
  if (!modules) return [];
  if (Array.isArray(modules)) {
    return modules.filter((moduleName): moduleName is string => typeof moduleName === 'string' && moduleName.trim().length > 0);
  }

  return Object.entries(modules)
    .filter(([, enabled]) => enabled)
    .map(([moduleName]) => moduleName);
}

export function getQueryTenantId(): string | null {
  const queryTenantId = new URLSearchParams(window.location.search).get('tenantId');
  return normalizeTenantId(queryTenantId);
}

export function getPlatformProductName(): string {
  return normalizeText(import.meta.env.VITE_PLATFORM_PRODUCT_NAME) || DEFAULT_PRODUCT_NAME;
}

export function getTenantSupportLabel(): string {
  return DEFAULT_SUPPORT_LABEL;
}

export function normalizeTenantBootstrap({
  resolvedTenant,
  tenantConfig,
  authBootstrap,
}: TenantBootstrapSources): TenantBootstrapData {
  const normalizedModules = normalizeModules(authBootstrap?.modules);
  const productName = getPlatformProductName();
  const tenantName =
    normalizeText(authBootstrap?.name) ||
    normalizeText(authBootstrap?.brandingName) ||
    normalizeText(authBootstrap?.tenant?.name) ||
    normalizeText(tenantConfig?.companyName) ||
    normalizeText(resolvedTenant?.brandingName) ||
    normalizeText(resolvedTenant?.name);

  const featureFlags = authBootstrap?.features || featureFlagsFromModules(normalizedModules);

  return {
    tenantId:
      normalizeTenantId(authBootstrap?.tenantId) ||
      normalizeTenantId(authBootstrap?.tenant?.id) ||
      normalizeTenantId(tenantConfig?.tenantId) ||
      normalizeTenantId(resolvedTenant?.tenantId),
    tenantName,
    displayName: tenantName || productName,
    logoUrl:
      normalizeText(authBootstrap?.brandingLogoUrl) ||
      normalizeText(authBootstrap?.tenant?.logoUrl) ||
      normalizeText(tenantConfig?.logoUrl) ||
      normalizeText(resolvedTenant?.brandingLogoUrl),
    brandColor:
      normalizeText(authBootstrap?.brandingPrimaryColor) ||
      normalizeText(authBootstrap?.tenant?.brandColor) ||
      normalizeText(tenantConfig?.primaryColor),
    primaryDomain:
      normalizeText(authBootstrap?.primaryDomain) ||
      normalizeText(authBootstrap?.tenant?.primaryDomain) ||
      normalizeText(resolvedTenant?.primaryDomain),
    supportEmail: normalizeText(authBootstrap?.supportEmail) || null,
    supportPhone: normalizeText(authBootstrap?.supportPhone) || null,
    planCode: normalizeText(authBootstrap?.planCode) || normalizeText(authBootstrap?.plan?.code),
    modules: normalizedModules,
    featureFlags,
    productName,
    supportLabel: getTenantSupportLabel(),
  };
}

export function getDevelopmentTenantId(): string | null {
  if (!import.meta.env.DEV) return null;

  const envTenantId = normalizeTenantId(import.meta.env.VITE_DEV_TENANT_ID);
  if (envTenantId) return envTenantId;

  return getQueryTenantId();
}

export function isTenantScopedApiPath(path: string): boolean {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (normalizedPath.startsWith('/public/')) return false;

  const publicAuthPaths = new Set([
    '/auth/login',
    '/auth/refresh',
    '/auth/request-password-reset',
    '/auth/reset-password',
    '/auth/accept-invite',
    '/auth/resend-invite',
  ]);

  return !publicAuthPaths.has(normalizedPath);
}

export function featureFlagsFromModules(modules?: string[] | null): Partial<FeatureFlags> | undefined {
  if (!modules?.length) return undefined;

  const flags: Partial<FeatureFlags> = {};
  modules.forEach((moduleName) => {
    const featureKey = MODULE_TO_FEATURE_FLAG[moduleName];
    if (featureKey) {
      flags[featureKey] = true;
    }
  });

  return Object.keys(flags).length > 0 ? flags : undefined;
}
