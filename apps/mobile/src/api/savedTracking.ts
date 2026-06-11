/**
 * Saved tracking codes, persisted per-user with SecureStore (the RN equivalent
 * of the web app's localStorage implementation).
 */
import { getItem, setItem } from "../lib/storage";

const key = (userId: string) => `packetflow_saved_${userId}`;

async function read(userId: string): Promise<string[]> {
  try {
    const raw = await getItem(key(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function write(userId: string, codes: string[]): Promise<void> {
  try {
    await setItem(key(userId), JSON.stringify(codes));
  } catch {
    // ignore
  }
}

export async function listSavedTracking(userId: string): Promise<string[]> {
  return read(userId);
}

export async function saveTrackingCode(userId: string, code: string): Promise<void> {
  const codes = await read(userId);
  if (!codes.includes(code)) await write(userId, [...codes, code]);
}

export async function removeTrackingCode(userId: string, code: string): Promise<void> {
  const codes = await read(userId);
  await write(userId, codes.filter((c) => c !== code));
}
