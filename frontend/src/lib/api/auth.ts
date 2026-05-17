const TOKEN_KEY = "authToken";

const isBrowser = typeof window !== "undefined";

export function setAuthToken(token: string): void {
  if (!isBrowser) return;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function getAuthToken(): string | null {
  if (!isBrowser) return null;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuthToken(): void {
  if (!isBrowser) return;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Bearer-token headers for authenticated API calls.
 * Returns an empty object when no token is present so callers can spread it
 * unconditionally.
 */
export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Clears every piece of client-side auth state. Caller is responsible for
 * navigation. Wipes both sessionStorage and localStorage because legacy code
 * (use-auth-portal) read currentUser from both.
 */
export function logout(): void {
  if (!isBrowser) return;
  clearAuthToken();
  try {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("currentUser");
  } catch {
    /* ignore */
  }
}
