import { PortalLayout } from "./portal/PortalLayout";
import { adminNavItems } from "./admin/navItems";
import { useAuthContext } from "contexts/AuthContext";
import { RoutePaths } from "shared/constants/routePaths";

export function AdminLayout() {
  const { user } = useAuthContext();
  const displayName = user?.fullName || user?.userName || "Admin User";

  return (
    <PortalLayout
      brandTitle="TestScan Admin"
      items={adminNavItems}
      homePath={RoutePaths.dashboard}
      profile={{
        name: displayName,
        email: user?.email ?? "admin@testscan.app",
        initial: displayName.charAt(0).toUpperCase(),
        profilePath: RoutePaths.settings,
        settingsPath: RoutePaths.settings,
      }}
    />
  );
}
