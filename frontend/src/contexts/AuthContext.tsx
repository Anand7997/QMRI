import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { authStorage, type AuthSession, type AuthUser } from "shared/auth/authStorage";

const ADMIN_ROLE = "ADMIN";

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  roles: string[];
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthContextProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => authStorage.getUser());

  const login = useCallback((session: AuthSession) => {
    authStorage.save(session);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const roles = user?.roles ?? [];
    const hasRole = (role: string) => roles.some((r) => r.toUpperCase() === role.toUpperCase());

    return {
      isAuthenticated: Boolean(user) && Boolean(authStorage.getToken()),
      user,
      roles,
      isAdmin: hasRole(ADMIN_ROLE),
      hasRole,
      login,
      logout,
    };
  }, [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthContextProvider.");
  }

  return context;
}
