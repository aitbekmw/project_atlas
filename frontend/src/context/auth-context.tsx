import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { login as loginRequest, logout as logoutRequest, register as registerRequest } from "@/api/auth";
import { getAccessToken, getRefreshToken, subscribeAuthSession } from "@/api/client";
import { getMe } from "@/api/users";
import { queryKeys } from "@/lib/query-keys";
import type { LoginPayload, RegisterPayload, User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  applyUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeLoginPayload(payload: LoginPayload): LoginPayload {
  return {
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
  };
}

function normalizeRegisterPayload(payload: RegisterPayload): RegisterPayload {
  return {
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    first_name: payload.first_name.trim(),
    last_name: payload.last_name.trim(),
    phone: payload.phone.trim(),
    role: payload.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyUser = useCallback(
    (next: User) => {
      setUser(next);
      queryClient.setQueryData(queryKeys.me, next);
      queryClient.setQueryData(queryKeys.user(next.id), next);
    },
    [queryClient],
  );

  const refreshUser = useCallback(async () => {
    if (!getAccessToken() && !getRefreshToken()) {
      setUser(null);
      return null;
    }

    try {
      const me = await getMe();
      applyUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, [applyUser]);

  useEffect(() => {
    void refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    return subscribeAuthSession(() => {
      setUser(null);
      queryClient.clear();
    });
  }, [queryClient]);

  const login = useCallback(async (payload: LoginPayload) => {
    await loginRequest(normalizeLoginPayload(payload));
    const me = await getMe();
    applyUser(me);
    return me;
  }, [applyUser]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const user = await registerRequest(normalizeRegisterPayload(payload));
    return user;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest(getRefreshToken());
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
      applyUser,
    }),
    [user, isLoading, login, register, logout, refreshUser, applyUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
