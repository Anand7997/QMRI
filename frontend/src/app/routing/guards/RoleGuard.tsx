import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "contexts/AuthContext";
import { RoutePaths } from "shared/constants/routePaths";

interface RoleGuardProps {
  allowedRoles: string[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { hasRole } = useAuthContext();
  const location = useLocation();
  const allowed = allowedRoles.some((role) => hasRole(role));

  if (!allowed) {
    return <Navigate to={RoutePaths.unauthorized} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}