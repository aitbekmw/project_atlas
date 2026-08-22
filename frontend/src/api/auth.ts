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

export async function verifyEmail(email: string, code: string): Promise<User> {
  const { data } = await api.post<User>("/auth/verify-email", { email, code });
  return data;
}

export async function resendVerification(email: string): Promise<void> {
  await api.post("/auth/resend-verification", { email });
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

export async function startGoogleLogin(): Promise<string> {
  const { data } = await api.get<{ authorization_url: string }>("/auth/google/start", {
    params: { origin: window.location.origin },
  });
  return data.authorization_url;
}

export async function exchangeGoogleCode(code: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/google/exchange", { code });
  setTokens(data);
  return data;
}

export async function completeGoogleProfile(payload: {
  code: string;
  phone: string;
  role: "customer" | "worker";
}): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/google/complete-profile", payload);
  setTokens(data);
  return data;
}
