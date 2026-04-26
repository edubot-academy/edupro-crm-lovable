// API client - uses production URL in production, localhost in development
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "https://api.edupro.edubot.it.com" : "");

// Security: Request timeout to prevent hanging requests (30 seconds)
const REQUEST_TIMEOUT = 30000;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
  /** Skip auto-refresh on 401 (used internally for refresh calls). */
  skipAuthRefresh?: boolean;
  /** Extra headers to merge (e.g. X-Company-Id). */
  extraHeaders?: Record<string, string>;
  /** Headers regenerated for each network attempt (e.g. X-Request-Id). */
  getAttemptHeaders?: (() => Record<string, string>) | undefined;
}

// This will be set by AuthContext after mount
let getAccessTokenFn: (() => Promise<string | null>) | null = null;
let getTenantIdFn: (() => string | null) | null = null;

export function setAccessTokenProvider(fn: () => Promise<string | null>) {
  getAccessTokenFn = fn;
}

export function setTenantIdProvider(fn: () => string | null) {
  getTenantIdFn = fn;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }

  private async performFetch(
    url: string,
    fetchOptions: RequestInit,
    baseHeaders: Record<string, string>,
    getAttemptHeaders?: (() => Record<string, string>) | undefined,
  ): Promise<Response> {
    const attemptHeaders = getAttemptHeaders ? getAttemptHeaders() : {};

    // Security: Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...baseHeaders,
          ...attemptHeaders,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      throw error;
    }
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, skipAuthRefresh, extraHeaders, getAttemptHeaders, ...fetchOptions } = options;

    // Get token from in-memory provider (which handles refresh)
    let token: string | null = null;
    if (getAccessTokenFn && !skipAuthRefresh) {
      token = await getAccessTokenFn();
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders || {}),
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    // Add X-Company-Id header if tenantId is available AND not already in extraHeaders
    // This prevents conflicts when login explicitly passes a tenantId
    const tenantId = getTenantIdFn ? getTenantIdFn() : null;
    if (tenantId && !extraHeaders?.['X-Company-Id']) {
      // Security: Sanitize tenant ID to prevent header injection attacks
      const sanitizedTenantId = tenantId.replace(/[^a-zA-Z0-9-_]/g, '');
      if (sanitizedTenantId.length > 0 && sanitizedTenantId.length <= 50) {
        headers["X-Company-Id"] = sanitizedTenantId;
      }
    }

    const url = this.buildUrl(path, params);
    const response = await this.performFetch(url, fetchOptions, headers, getAttemptHeaders);

    if (response.status === 401 && !skipAuthRefresh && getAccessTokenFn) {
      // Try refresh once
      const newToken = await getAccessTokenFn();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        const retryResponse = await this.performFetch(url, fetchOptions, headers, getAttemptHeaders);
        if (retryResponse.ok) {
          if (retryResponse.status === 204) return undefined as T;
          return retryResponse.json();
        }
        const retryError = await retryResponse.json().catch(() => undefined);
        throw {
          message: retryError?.error?.message || retryError?.message || 'Request failed',
          status: retryResponse.status,
          code: retryError?.error?.code || retryError?.code,
          details: retryError?.error?.details || retryError?.details,
          requestId: retryError?.requestId || retryResponse.headers.get('X-Request-Id') || undefined,
          success: retryError?.success,
        };
      }
      throw { message: "Unauthorized", status: 401 };
    }

    if (!response.ok) {
      const error = await response.json().catch(() => undefined);
      throw {
        message: error?.error?.message || error?.message || 'Request failed',
        status: response.status,
        code: error?.error?.code || error?.code,
        details: error?.error?.details || error?.details,
        requestId: error?.requestId || response.headers.get('X-Request-Id') || undefined,
        success: error?.success,
      };
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  get<T>(path: string, params?: Record<string, string | number | undefined>, options?: { extraHeaders?: Record<string, string>; getAttemptHeaders?: (() => Record<string, string>) | undefined }): Promise<T> {
    return this.request<T>(path, { method: "GET", params, ...options });
  }

  post<T>(path: string, body?: unknown, options?: { skipAuthRefresh?: boolean; extraHeaders?: Record<string, string>; getAttemptHeaders?: (() => Record<string, string>) | undefined }): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  put<T>(path: string, body?: unknown, options?: { extraHeaders?: Record<string, string>; getAttemptHeaders?: (() => Record<string, string>) | undefined }): Promise<T> {
    return this.request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, ...options });
  }

  patch<T>(path: string, body?: unknown, options?: { extraHeaders?: Record<string, string>; getAttemptHeaders?: (() => Record<string, string>) | undefined }): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined, ...options });
  }

  delete<T>(path: string, options?: { extraHeaders?: Record<string, string>; getAttemptHeaders?: (() => Record<string, string>) | undefined }): Promise<T> {
    return this.request<T>(path, { method: "DELETE", ...options });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
