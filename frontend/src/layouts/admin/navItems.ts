import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { RoutePaths } from "shared/constants/routePaths";
import type { PortalNavItem } from "layouts/portal/types";

export const adminNavItems: PortalNavItem[] = [
  { id: "dashboard", label: "Dashboard", path: RoutePaths.dashboard, icon: DashboardOutlinedIcon },
  { id: "authentication", label: "Authentication", path: RoutePaths.authentication, icon: AdminPanelSettingsOutlinedIcon },
  { id: "assessment", label: "Assessment", path: RoutePaths.assessments, icon: AssignmentOutlinedIcon },
  { id: "question-bank", label: "Question Bank", path: RoutePaths.questionBank, icon: QuizOutlinedIcon },
  { id: "structure", label: "Structure", path: RoutePaths.structure, icon: AccountTreeOutlinedIcon },
  { id: "reports", label: "Reports", path: RoutePaths.reports, icon: AssessmentOutlinedIcon },
  { id: "settings", label: "Settings", path: RoutePaths.settings, icon: SettingsOutlinedIcon },
];