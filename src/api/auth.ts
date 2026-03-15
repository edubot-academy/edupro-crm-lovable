import { apiClient } from './client';
import type { AuthTokens, LoginRequest, AcceptInviteRequest, ResetPasswordRequest } from '@/types';

export const authApi = {
  /** POST /api/auth/login — returns { accessToken, refreshToken } */
  login: (data: LoginRequest) =>
    apiClient.post<AuthTokens>('/api/auth/login', data),

  /** POST /api/auth/refresh — returns { accessToken, refreshToken } */
  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/api/auth/refresh', { refreshToken }, { skipAuthRefresh: true }),

  /** POST /api/auth/logout — invalidates refresh token server-side */
  logout: () =>
    apiClient.post<void>('/api/auth/logout'),

  /** POST /api/auth/accept-invite — returns { accessToken, refreshToken } */
  acceptInvite: (data: AcceptInviteRequest) =>
    apiClient.post<AuthTokens>('/api/auth/accept-invite', data),

  /** POST /api/auth/resend-invite */
  resendInvite: (email: string) =>
    apiClient.post<void>('/api/auth/resend-invite', { email }),

  /** POST /api/auth/request-password-reset */
  requestPasswordReset: (email: string) =>
    apiClient.post<void>('/api/auth/request-password-reset', { email }),

  /** POST /api/auth/reset-password */
  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<void>('/api/auth/reset-password', data),
};
