import React, { createContext, useContext, useEffect, useState } from "react";
import { getItem, setItem, deleteItem } from "../lib/storage";
import {
  authApi,
  setToken as setApiToken,
  clearToken as clearApiToken,
} from "@packetflow/backend-client";
import type { Role } from "@packetflow/types";

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role: "sender" | "recipient" | "carrier";
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  patchUser: (partial: Partial<AuthUser>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "packetflow_token";
const USER_KEY = "packetflow_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getItem(TOKEN_KEY);
        const storedUser = await getItem(USER_KEY);
        if (storedToken && storedUser) {
          // Seed the API client so authenticated requests carry the token
          // immediately on app launch (the client has no localStorage in RN).
          setApiToken(storedToken);
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    // The client takes positional args and returns { user: { id, name, ... }, token }.
    const result = await authApi.login(email, password);
    const authUser: AuthUser = {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.name,
      role: result.user.role,
    };
    await setItem(TOKEN_KEY, result.token);
    await setItem(USER_KEY, JSON.stringify(authUser));
    // authApi.login already called setToken internally; this keeps it explicit.
    setApiToken(result.token);
    setToken(result.token);
    setUser(authUser);
  };

  const register = async (input: RegisterInput) => {
    const result = await authApi.register({
      name: input.fullName,
      email: input.email,
      password: input.password,
      role: input.role,
    });
    const authUser: AuthUser = {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.name,
      role: result.user.role,
    };
    await setItem(TOKEN_KEY, result.token);
    await setItem(USER_KEY, JSON.stringify(authUser));
    setApiToken(result.token);
    setToken(result.token);
    setUser(authUser);
  };

  const patchUser = async (partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      setItem(USER_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const logout = async () => {
    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);
    clearApiToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, patchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
