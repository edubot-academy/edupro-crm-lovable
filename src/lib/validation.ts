/**
 * Shared validation utilities
 */

/**
 * Validates and sanitizes a tenant ID
 * @param tenantId - The raw tenant ID to validate
 * @returns Sanitized tenant ID or empty string if invalid
 */
export function validateAndSanitizeTenantId(tenantId: string): string {
  const sanitized = tenantId.trim().replace(/[^a-zA-Z0-9-_]/g, '');
  // Max 50 characters as per security requirements
  return sanitized.length > 50 ? '' : sanitized;
}

/**
 * Checks if a tenant ID is valid
 * @param tenantId - The tenant ID to check
 * @returns true if valid, false otherwise
 */
export function isValidTenantId(tenantId: string): boolean {
  const sanitized = validateAndSanitizeTenantId(tenantId);
  return sanitized.length > 0 && sanitized === tenantId.trim();
}
