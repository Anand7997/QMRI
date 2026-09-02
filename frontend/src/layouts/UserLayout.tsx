import { PortalLayout } from "./portal/PortalLayout";
import { userNavItems } from "./user/navItems";
import { matchPath, useLocation } from "react-router-dom";
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
    && Boolean(
      matchPath(RoutePaths.portalAssessments, location.pathname)
        || matchPath(RoutePaths.portalAgentAnalysis, location.pathname)
        || matchPath(RoutePaths.portalReports, location.pathname),
    );

  return (
    <PortalLayout
      brandTitle="TestScan Portal"
      items={userNavItems}
      homePath={RoutePaths.portalDashboard}
      profile={{
        name: displayName,
        email: user?.email ?? "user@testscan.app",
        initial: displayName.charAt(0).toUpperCase(),
        profilePath: RoutePaths.portalProfile,
        settingsPath: RoutePaths.portalSettings,
      }}
      hideChrome={hidePortalChrome}
    />
  );
}
