/**
 * Saved Tracking — localStorage implementation.
 *
 * Stores each user's saved tracking codes in `localStorage` under the key
 * `packetflow:saved:<userId>` so they persist across page reloads without
 * needing a backend endpoint.
 *
 * BACKEND CONTRACT (when ready to migrate):
 *   GET    /api/v1/me/saved-tracking          -> string[]
 *   PUT    /api/v1/me/saved-tracking/:code    -> 204
 *   DELETE /api/v1/me/saved-tracking/:code    -> 204
 *
 * When those endpoints exist, replace the three functions below with real
 * fetch calls and remove this comment.
 */

const storageKey = (userId: string) => `packetflow:saved:${userId}`;

function read(userId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(userId: string, codes: string[]): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(codes));
  } catch {
    // localStorage may be unavailable in some contexts — fail silently
  }
}

export async function listSavedTracking(userId: string): Promise<string[]> {
  return read(userId);
}

export async function saveTrackingCode(userId: string, code: string): Promise<void> {
  const codes = read(userId);
  if (!codes.includes(code)) {
    write(userId, [...codes, code]);
  }
}

export async function removeTrackingCode(userId: string, code: string): Promise<void> {
  write(userId, read(userId).filter((c) => c !== code));
}
