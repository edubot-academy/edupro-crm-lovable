import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@/types';
import { authApi } from '@/api/auth';
import { decodeJwt, isTokenExpired } from '@/lib/jwt';
import { setAccessTokenProvider } from '@/api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Get a valid access token (refreshes automatically if expired). */
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory access token (never persisted to localStorage)
let accessTokenMemory: string | null = null;

const REFRESH_TOKEN_KEY = 'refresh_token';

function userFromToken(token: string): User | null {
  const payload = decodeJwt(token);
  if (!payload) return null;
  return {
    id: payload.id,
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromise = useRef<Promise<string | null> | null>(null);

  // On mount, attempt to restore session via refresh token
  useEffect(() => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }

    authApi.refresh(refreshToken)
      .then((tokens) => {
        accessTokenMemory = tokens.accessToken;
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        setUser(userFromToken(tokens.accessToken));
      })
      .catch(() => {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        accessTokenMemory = null;
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login({ email, password });
    accessTokenMemory = tokens.accessToken;
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    setUser(userFromToken(tokens.accessToken));
  }, []);

  const logout = useCallback(async () => {
    try {
      if (accessTokenMemory) {
        await authApi.logout();
      }
    } catch {
      // best-effort server-side logout
    } finally {
      accessTokenMemory = null;
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
    }
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    // If token exists and not expired, return it
    if (accessTokenMemory && !isTokenExpired(accessTokenMemory)) {
      return accessTokenMemory;
    }

    // Deduplicate concurrent refresh calls
    if (refreshPromise.current) {
      return refreshPromise.current;
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      accessTokenMemory = null;
      setUser(null);
      return null;
    }

    refreshPromise.current = authApi.refresh(refreshToken)
      .then((tokens) => {
        accessTokenMemory = tokens.accessToken;
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        setUser(userFromToken(tokens.accessToken));
        return tokens.accessToken;
      })
      .catch(() => {
        accessTokenMemory = null;
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setUser(null);
        return null;
      })
      .finally(() => {
        refreshPromise.current = null;
      });

    return refreshPromise.current;
  }, []);

  // Register the token provider with the API client
  useEffect(() => {
    setAccessTokenProvider(getAccessToken);
  }, [getAccessToken]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
