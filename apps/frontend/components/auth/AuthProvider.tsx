"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@stock-alert/shared-types";
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/apiClient";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    whatsappPhone?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateWhatsappPhone: (phone: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiGet<User>("/api/auth/me");
      setUser(me);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    void refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const loggedIn = await apiPost<User>("/api/auth/login", { email, password });
      setUser(loggedIn);
      router.push("/");
    },
    [router],
  );

  const register = useCallback(
    async (email: string, password: string, whatsappPhone?: string) => {
      const created = await apiPost<User>("/api/auth/register", {
        email,
        password,
        whatsappPhone,
      });
      setUser(created);
      router.push("/");
    },
    [router],
  );

  const logout = useCallback(async () => {
    await apiPost<void>("/api/auth/logout", {});
    setUser(null);
    router.push("/login");
  }, [router]);

  const updateWhatsappPhone = useCallback(async (phone: string) => {
    const updated = await apiPatch<User>("/api/auth/me", { whatsappPhone: phone });
    setUser(updated);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      updateWhatsappPhone,
      refreshUser,
    }),
    [user, loading, login, register, logout, updateWhatsappPhone, refreshUser],
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
