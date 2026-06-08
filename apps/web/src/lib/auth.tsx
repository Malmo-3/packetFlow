/**
 * Authentication context and provider for the PacketFlow web app.
 *
 * **Session lifecycle:**
 * 1. On mount, the provider reads any stored user from `localStorage` immediately
 *    so the UI doesn't flash a logged-out state on hard refresh.
 * 2. It then calls `GET /auth/me` to verify the token is still valid.
 *    - If valid: keeps the stored user.
 *    - If invalid/expired: clears the session and redirects to login.
 *    - If the backend is unreachable: keeps the cached user so the UI stays
 *      usable — individual API calls will surface errors as needed.
 * 3. `loading` is `true` until the `/me` check resolves. `ProtectedRoute`
 *    renders `null` during this window to avoid a flicker.
 *
 * **Usage:**
 * ```tsx
 * const { user, login, register, signOut } = useAuth();
 * ```
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, type AuthUser } from "@packetflow/api-client";
import type { Role } from "./types";

const USER_KEY = "packetflow:user";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export type { AuthUser };

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: "sender" | "recipient" | "carrier";
  phone?: string;
  address?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function storeUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem(USER_KEY);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  // Hydrate immediately from localStorage so the UI doesn't flash a logged-out
  // state on refresh while the /me request is in flight.
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const [loading, setLoading] = useState(true);

  // On mount: verify the stored token is still valid.
  // If /me returns null (expired/missing token) we clear the session.
  // If /me throws (network error, backend down) we keep the stored session
  // so the UI stays usable — individual API calls will surface errors instead.
  useEffect(() => {
    authApi.me()
      .then((meUser) => {
        if (!meUser) {
          setUser(null);
          clearUser();
        }
      })
      .catch(() => {
        // Backend unreachable — leave the cached user in place.
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const result = await authApi.login(email, password);
    storeUser(result.user);
    setUser(result.user);
  };

  const register = async (input: RegisterInput): Promise<void> => {
    const result = await authApi.register({
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    });
    storeUser(result.user);
    setUser(result.user);
  };

  const signOut = () => {
    authApi.logout();
    clearUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook + helpers
// ---------------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function defaultRouteForRole(role: Role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "carrier":
      return "/carrier/packages";
    case "sender":
      return "/sender";
    case "recipient":
      return "/recipient";
  }
}
