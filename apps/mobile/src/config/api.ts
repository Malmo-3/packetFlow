/**
 * Resolves the backend API base URL for the mobile app and configures the
 * shared @packetflow/backend-client.
 *
 * Unlike the web app (which runs on the same machine as the backend and can use
 * `localhost`), the mobile app may run on a physical device or emulator that
 * can't reach the developer's `localhost`. In development we derive the host
 * from the Expo dev server address (`Constants.expoConfig.hostUri`, e.g.
 * "192.168.1.10:8081") and point it at the backend port.
 *
 * Resolution order:
 * 1. `expo.extra.apiUrl` in app.json (explicit override, e.g. a deployed API).
 * 2. The Expo dev-server host + backend port (works on device/emulator/simulator).
 * 3. `http://localhost:3001/api/v1` fallback.
 *
 * Import this module for its side effect once at app startup (see app/_layout.tsx).
 */
import Constants from "expo-constants";
import { setBaseUrl } from "@packetflow/backend-client";

/** Port the backend listens on (see apps/api). */
const API_PORT = 3001;
const API_PATH = "/api/v1";
const FALLBACK = `http://localhost:${API_PORT}${API_PATH}`;

function resolveApiBaseUrl(): string {
  const explicit = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (explicit) return explicit;

  // hostUri looks like "192.168.1.10:8081" (LAN) or "localhost:8081".
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  if (host) return `http://${host}:${API_PORT}${API_PATH}`;

  return FALLBACK;
}

export const API_BASE_URL = resolveApiBaseUrl();

setBaseUrl(API_BASE_URL);
