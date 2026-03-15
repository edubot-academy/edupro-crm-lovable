import type { UserRole } from '@/types';

export interface JwtPayload {
  sub: string;
  id: number;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}

/** Decode a JWT without verification (client-side only). */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

/** Check if JWT is expired (with 30s buffer). */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return Date.now() >= (payload.exp - 30) * 1000;
}
