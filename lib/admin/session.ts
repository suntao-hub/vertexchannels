// Client-side admin session store. Uses localStorage so the session survives
// new tabs, window reopens, and deploys — bounded by SESSION_TTL_MS and the
// HMAC signature the server checks on every request.

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const KEY = "vc_admin_session";

export function storeSession(token: string): void {
  try {
    localStorage.setItem(KEY, token);
    sessionStorage.removeItem(KEY); // retire the old per-tab store
  } catch { /* */ }
}

export function readSession(): string | null {
  try {
    const fromLocal = localStorage.getItem(KEY);
    const stored = fromLocal ?? sessionStorage.getItem(KEY);
    if (!stored) return null;
    const ts = parseInt(stored.split(":")[0], 10);
    if (isNaN(ts) || Date.now() - ts > SESSION_TTL_MS) {
      clearSession();
      return null;
    }
    if (!fromLocal) storeSession(stored); // migrate a legacy per-tab session
    return stored;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch { /* */ }
}
