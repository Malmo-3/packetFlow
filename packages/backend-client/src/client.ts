/**
 * @packageDocumentation
 * Base HTTP client for the PacketFlow backend (`/api/v1`).
 *
 * **Token management**
 * - `setToken(token)` — call after a successful login; persists to `localStorage`.
 * - `clearToken()` — call on logout to remove the stored token.
 * - Every `request()` call automatically reads the current token and injects it
 *   as an `Authorization: Bearer` header.
 *
 * **Base URL resolution** (first match wins):
 * 1. `import.meta.env.VITE_API_URL` (Vite / browser builds)
 * 2. `process.env.API_URL` (Node.js / tests)
 * 3. `http://localhost:3001/api/v1` (local dev fallback)
 */

/** localStorage key used to persist the bearer token across page reloads. */
export const TOKEN_KEY = "packetflow:token";

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------
//
// This client runs in two environments:
// - Web (Vite): `localStorage` is available and used to persist across reloads.
// - React Native (Hermes): there is no `localStorage`. The token lives only in
//   memory here; the mobile app is responsible for its own durable storage
//   (e.g. expo-secure-store) and seeds this module via `setToken` on startup.
//
// We keep an in-memory token as the source of truth and mirror it to
// localStorage when that API exists, so neither environment throws.

let inMemoryToken: string | null = null;

/** True when a usable `localStorage` is present (browser), false in React Native. */
function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage !== null;
  } catch {
    return false;
  }
}

/** Resolved API base URL — trailing slash is stripped. */
export const API_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  (typeof process !== "undefined" && process.env?.API_URL) ||
  "http://localhost:3001/api/v1";

// The effective base URL used for requests. Defaults to API_BASE_URL but can be
// overridden at runtime — e.g. the mobile app derives the developer machine's
// LAN address from the Expo dev server so a physical device can reach the API.
let currentBaseUrl = API_BASE_URL.replace(/\/$/, "");

/**
 * Override the API base URL at runtime. Call this once at app startup before
 * any request is made. The trailing slash is stripped automatically.
 */
export function setBaseUrl(url: string): void {
  currentBaseUrl = url.replace(/\/$/, "");
}

/** The base URL currently used for requests. */
export function getBaseUrl(): string {
  return currentBaseUrl;
}

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

/**
 * Persist a bearer token. Should be called by the auth layer immediately after
 * a successful login or registration. On the web it also mirrors to
 * `localStorage`; in React Native the token is held in memory only.
 *
 * The mobile app should additionally call this on startup with the token it
 * rehydrated from its own secure storage, so authenticated requests work after
 * an app restart.
 */
export function setToken(token: string): void {
  inMemoryToken = token;
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignore quota/availability errors — the in-memory token still works.
    }
  }
}

/**
 * Remove the stored bearer token. Should be called on logout to ensure
 * subsequent requests are unauthenticated.
 */
export function clearToken(): void {
  inMemoryToken = null;
  if (hasLocalStorage()) {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore — clearing the in-memory token above is sufficient.
    }
  }
}

/**
 * Read the current token. Prefers the in-memory value (set this session),
 * falling back to `localStorage` on the web so a page reload stays signed in.
 * Returns `null` if absent or inaccessible.
 */
function getToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (hasLocalStorage()) {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

/**
 * Thrown by {@link request} when the server responds with a non-2xx status.
 *
 * @example
 * ```ts
 * try {
 *   await packagesApi.createPackage(input);
 * } catch (err) {
 *   if (err instanceof ApiError && err.status === 409) {
 *     // handle conflict
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  /** HTTP status code (e.g. 400, 401, 404, 409, 500). */
  readonly status: number;
  /** Parsed response body, or the raw text if not JSON. */
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

type Json = Record<string, unknown> | unknown[] | null;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Will be JSON-serialised and sent as the request body. */
  body?: Json;
  /** Passed through to `fetch` for request cancellation. */
  signal?: AbortSignal;
  /** Additional headers merged on top of the defaults. */
  headers?: Record<string, string>;
}

/**
 * Typed wrapper around `fetch` that targets the PacketFlow API.
 *
 * - Prepends {@link API_BASE_URL} to `path`.
 * - Injects `Authorization: Bearer <token>` when a token is stored.
 * - Parses the response as JSON when the server returns `Content-Type: application/json`.
 * - Throws {@link ApiError} on any non-2xx response.
 *
 * @param path - API path relative to the base URL, e.g. `"/packages"`.
 * @param options - Method, body, signal, and extra headers.
 * @returns Parsed response body cast to `T`.
 * @throws {ApiError} When the server returns a non-2xx status.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, headers } = options;

  const url = `${currentBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const token = getToken();

  const response = await fetch(url, {
    method,
    signal,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof (payload as { message: unknown }).message === "string"
        ? (payload as { message: string }).message
        : null) || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}
