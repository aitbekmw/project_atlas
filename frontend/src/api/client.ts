import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { getApiBaseUrl } from "@/lib/env";
import type { TokenResponse } from "@/types/api";

const ACCESS_KEY = "atlas.access_token";
const REFRESH_KEY = "atlas.refresh_token";
const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

type AuthSessionListener = () => void;
const authSessionListeners = new Set<AuthSessionListener>();

export function subscribeAuthSession(listener: AuthSessionListener): () => void {
  authSessionListeners.add(listener);
  return () => {
    authSessionListeners.delete(listener);
  };
}

function notifyAuthCleared() {
  for (const listener of authSessionListeners) {
    listener();
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: TokenResponse): void {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function isAuthUrl(url?: string): boolean {
  if (!url) {
    return false;
  }
  return /\/auth\/(login|register|refresh|token|logout)(?:\?|$)/.test(url);
}

api.interceptors.request.use((config) => {
  if (isAuthUrl(config.url)) {
    return config;
  }

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const { data } = await axios.post<TokenResponse>(
    `${API_BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
  );

  setTokens(data);
  return data.access_token;
}

function forceLogout() {
  clearTokens();
  notifyAuthCleared();
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthUrl(original.url)
    ) {
      original._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }

        const accessToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        forceLogout();
      }
    }

    return Promise.reject(error);
  },
);
