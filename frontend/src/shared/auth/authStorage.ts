// Lightweight persistence for the JWT access token + authenticated user profile.
// Kept in localStorage so a page refresh preserves the session.

export interface AuthUser {
  userId: string;
  fullName?: string;
  userName: string;
  email: string;
  approvalStatus?: string;
  roles: string[];
}

export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  user: AuthUser;
}

const TOKEN_KEY = "qmri.accessToken";
const TOKEN_EXPIRES_KEY = "qmri.accessTokenExpiresAtUtc";
const USER_KEY = "qmri.user";
const EXPIRY_CLOCK_SKEW_MS = 30_000;

export const authStorage = {
  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return null;
    }

    if (isExpired(token)) {
      this.clear();
      return null;
    }

    return token;
  },

  getUser(): AuthUser | null {
    if (!this.getToken()) {
      return null;
    }

    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  save(session: AuthSession) {
    localStorage.setItem(TOKEN_KEY, session.accessToken);
    localStorage.setItem(TOKEN_EXPIRES_KEY, session.accessTokenExpiresAtUtc);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

function isExpired(token: string) {
  const storedExpiry = localStorage.getItem(TOKEN_EXPIRES_KEY);
  const expiresAt = storedExpiry ?? readJwtExpiry(token);

  if (!expiresAt) {
    return true;
  }

  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) {
    return true;
  }

  return expiresAtMs <= Date.now() + EXPIRY_CLOCK_SKEW_MS;
}

function readJwtExpiry(token: string): string | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(padded)) as { exp?: number };

    return parsed.exp ? new Date(parsed.exp * 1000).toISOString() : null;
  } catch {
    return null;
  }
}