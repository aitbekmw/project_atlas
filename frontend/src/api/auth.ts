import { api, clearTokens, setTokens } from "@/api/client";
import type { LoginPayload, RegisterPayload, TokenResponse, User } from "@/types/api";

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/login", payload);
  setTokens(data);
  return data;
}

export async function refreshSession(refreshToken: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  setTokens(data);
  return data;
}

export async function logout(refreshToken: string | null): Promise<void> {
  if (refreshToken) {
    try {
      await api.post("/auth/logout", { refresh_token: refreshToken });
    } catch {
      // token already invalid or revoked
    }
  }
  clearTokens();
}
