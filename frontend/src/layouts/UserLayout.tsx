import { PortalLayout } from "./portal/PortalLayout";
import { userNavItems } from "./user/navItems";
import { useAuthContext } from "contexts/AuthContext";
import { RoutePaths } from "shared/constants/routePaths";

export function UserLayout() {
  const { user } = useAuthContext();
  const displayName = user?.fullName || user?.userName || "Portal User";

  return (
    <PortalLayout
      brandTitle="QMRI Portal"
      items={userNavItems}
      homePath={RoutePaths.portalDashboard}
      profile={{
        name: displayName,
        email: user?.email ?? "user@qmri.app",
        initial: displayName.charAt(0).toUpperCase(),
        profilePath: RoutePaths.portalProfile,
        settingsPath: RoutePaths.portalSettings,
      }}
    />
  );
}
