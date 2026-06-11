/**
 * Auth API client.
 *
 * Endpoints:
 * - `POST /api/v1/auth/register` → `{ success, data: { id, fullName, email, role } }`
 * - `POST /api/v1/auth/login`    → `{ success, token, data: { id, fullName, email, role } }`
 * - `GET  /api/v1/auth/me`       → `{ success, data: { userId, email, role } }`
 */

import { request, setToken, clearToken, ApiError } from "./client";

/** Raw user shape returned by the backend. Normalised before leaving this module. */
interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "carrier" | "sender" | "recipient";
}

/**
 * Normalised user object stored in the client session.
 * `name` is mapped from `fullName` so the rest of the app uses a consistent key.
 */
export interface AuthUser {
  id: string;
  /** Mapped from `fullName` returned by the backend. */
  name: string;
  email: string;
  role: "admin" | "carrier" | "sender" | "recipient";
}

/** Returned by {@link login} and {@link register} after a successful auth flow. */
export interface AuthResult {
  user: AuthUser;
  token: string;
}

interface RegisterBody {
  fullName: string;
  email: string;
  password: string;
  role: "sender" | "recipient" | "carrier" | "admin";
}

interface LoginResponse {
  success: boolean;
  token: string;
  data: BackendUser;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data: BackendUser;
}

interface MeResponse {
  success: boolean;
  data: {
    userId: string;
    email: string;
    role: string;
  };
}

/** Maps the backend's `fullName` field to the client-side `name` field. */
function fromBackendUser(u: BackendUser): AuthUser {
  return { id: u.id, name: u.fullName, email: u.email, role: u.role };
}

/**
 * Authenticate with email and password.
 * Stores the returned JWT via `setToken` so all subsequent requests are authenticated.
 *
 * @throws {ApiError} 401 if credentials are invalid.
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  setToken(res.token);
  return { user: fromBackendUser(res.data), token: res.token };
}

/**
 * Register a new user account, then immediately log in to obtain a JWT.
 * The registration endpoint does not return a token, so a second `/auth/login`
 * call is made internally.
 *
 * @throws {ApiError} 409 if the email address is already registered.
 */
export async function register(input: {
  name: string;
  email: string;
  password: string;
  role: "sender" | "recipient" | "carrier" | "admin";
  phone?: string;
  address?: string;
}): Promise<AuthResult> {
  await request<RegisterResponse>("/auth/register", {
    method: "POST",
    body: {
      fullName: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    } as RegisterBody,
  });

  // Registration doesn't return a token — log in immediately to get one.
  return login(input.email, input.password);
}

/**
 * Validate the currently stored JWT against the backend.
 *
 * - Returns the decoded session user when the token is valid.
 * - Returns `null` on 401/403 — the token is missing or expired and the
 *   caller should clear the session.
 * - **Throws** on network errors or unexpected server errors so the caller
 *   can keep the cached session alive rather than forcing a logout.
 *
 * Note: `/me` returns the JWT payload, not a full user profile.
 * The `name` field will be an empty string — sufficient for session rehydration.
 */
export async function me(): Promise<AuthUser | null> {
  try {
    const res = await request<MeResponse>("/auth/me");
    return {
      id: res.data.userId,
      name: "",
      email: res.data.email,
      role: res.data.role as AuthUser["role"],
    };
  } catch (err) {
    // Only clear the session for explicit auth rejections.
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return null;
    }
    // Network error, timeout, 5xx — propagate so auth.tsx keeps the cached user.
    throw err;
  }
}

/**
 * Clear the stored JWT. Call this on user-initiated logout.
 * Does not hit any endpoint — the token is simply removed from `localStorage`.
 */
export function logout(): void {
  clearToken();
}

interface UpdateMeResponse {
  success: boolean;
  data: BackendUser & { role: AuthUser["role"] };
}

/** Update the signed-in user's own profile (currently the display name). */
export async function updateProfile(input: { fullName?: string }): Promise<AuthUser> {
  const res = await request<UpdateMeResponse>("/auth/me", {
    method: "PATCH",
    body: input,
  });
  return fromBackendUser({
    id: res.data.id,
    fullName: res.data.fullName,
    email: res.data.email,
    role: res.data.role,
  });
}

/** Delete the signed-in user's own account, then clear the local token. */
export async function deleteAccount(): Promise<void> {
  await request("/auth/me", { method: "DELETE" });
  clearToken();
}
