import { apiClient } from './client';
import type { AuthTokens, LoginRequest, AcceptInviteRequest, ResetPasswordRequest } from '@/types';

export const authApi = {
  /** POST /auth/login — returns { accessToken, refreshToken } */
  login: (data: LoginRequest, tenantId?: string) =>
    apiClient.post<AuthTokens>('/auth/login', data, {
      extraHeaders: tenantId !== undefined ? { 'X-Company-Id': tenantId } : undefined,
    }),

  /** POST /auth/refresh — returns { accessToken, refreshToken } */
  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }, { skipAuthRefresh: true }),

  /** POST /auth/logout — invalidates refresh token server-side */
  logout: () =>
    apiClient.post<void>('/auth/logout'),

  /** POST /auth/accept-invite — returns { accessToken, refreshToken } */
  acceptInvite: (data: AcceptInviteRequest) =>
    apiClient.post<AuthTokens>('/auth/accept-invite', data),

  /** POST /auth/resend-invite */
  resendInvite: (email: string) =>
    apiClient.post<void>('/auth/resend-invite', { email }),

  /** POST /auth/request-password-reset */
  requestPasswordReset: (email: string) =>
    apiClient.post<void>('/auth/request-password-reset', { email }),

  /** POST /auth/reset-password */
  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<void>('/auth/reset-password', data),
};
