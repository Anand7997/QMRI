import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "contexts/AuthContext";
import { RoutePaths } from "shared/constants/routePaths";

export function AuthGuard() {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={RoutePaths.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
