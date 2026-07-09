import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { RoutePaths } from "shared/constants/routePaths";
import type { PortalNavItem } from "layouts/portal/types";

export const userNavItems: PortalNavItem[] = [
  { id: "dashboard", label: "Dashboard", path: RoutePaths.portalDashboard, icon: DashboardOutlinedIcon },
  { id: "my-assessments", label: "My Assessments", path: RoutePaths.portalAssessments, icon: AssignmentOutlinedIcon },
  { id: "history", label: "History", path: RoutePaths.portalHistory, icon: HistoryOutlinedIcon },
  { id: "reports", label: "Reports", path: RoutePaths.portalReports, icon: AssessmentOutlinedIcon },
  { id: "profile", label: "Profile", path: RoutePaths.portalProfile, icon: PersonOutlineIcon },
  { id: "settings", label: "Settings", path: RoutePaths.portalSettings, icon: SettingsOutlinedIcon },
];
