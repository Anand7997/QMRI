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
const USER_KEY = "qmri.user";

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): AuthUser | null {
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
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};