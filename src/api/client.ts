// API client - uses production URL in production, localhost in development
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "https://api.edupro.edubot.it.com" : "http://localhost:4000");

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
  /** Skip auto-refresh on 401 (used internally for refresh calls). */
  skipAuthRefresh?: boolean;
  /** Extra headers to merge (e.g. X-Company-Id). */
  extraHeaders?: Record<string, string>;
}

// This will be set by AuthContext after mount
let getAccessTokenFn: (() => Promise<string | null>) | null = null;

export function setAccessTokenProvider(fn: () => Promise<string | null>) {
  getAccessTokenFn = fn;
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

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, skipAuthRefresh, extraHeaders, ...fetchOptions } = options;

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

    const response = await fetch(this.buildUrl(path, params), {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401 && !skipAuthRefresh && getAccessTokenFn) {
      // Try refresh once
      const newToken = await getAccessTokenFn();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        const retryResponse = await fetch(this.buildUrl(path, params), {
          ...fetchOptions,
          headers,
        });
        if (retryResponse.ok) {
          if (retryResponse.status === 204) return undefined as T;
          return retryResponse.json();
        }
      }
      throw { message: "Unauthorized", status: 401 };
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw { message: error.message || "Request failed", status: response.status, code: error.code };
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  get<T>(path: string, params?: Record<string, string | number | undefined>, extraHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: "GET", params, extraHeaders });
  }

  post<T>(path: string, body?: unknown, options?: { skipAuthRefresh?: boolean; extraHeaders?: Record<string, string> }): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  put<T>(path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, extraHeaders });
  }

  patch<T>(path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined, extraHeaders });
  }

  delete<T>(path: string, extraHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: "DELETE", extraHeaders });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
