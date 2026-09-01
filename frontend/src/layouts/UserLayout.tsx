import { PortalLayout } from "./portal/PortalLayout";
import { userNavItems } from "./user/navItems";
import { useLocation } from "react-router-dom";
import { useAuthContext } from "contexts/AuthContext";
import { isAssessmentLinkNavigationState } from "shared/constants/assessmentNavigation";
import { RoutePaths } from "shared/constants/routePaths";

export function UserLayout() {
  const location = useLocation();
  const { user } = useAuthContext();
  const displayName = user?.fullName || user?.userName || "Portal User";
  const isIdentityLinkSession = isAssessmentLinkNavigationState(location.state);
  const hidePortalChrome =
    isIdentityLinkSession
    && (location.pathname === RoutePaths.portalAssessments || location.pathname === RoutePaths.portalReports);

  return (
    <PortalLayout
      brandTitle="QAScan Portal"
      items={userNavItems}
      homePath={RoutePaths.portalDashboard}
      profile={{
        name: displayName,
        email: user?.email ?? "user@qmri.app",
        initial: displayName.charAt(0).toUpperCase(),
        profilePath: RoutePaths.portalProfile,
        settingsPath: RoutePaths.portalSettings,
      }}
      hideChrome={hidePortalChrome}
    />
  );
}
