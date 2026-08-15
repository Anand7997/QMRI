import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { RoutePaths } from "shared/constants/routePaths";
import type { PortalNavItem } from "layouts/portal/types";

export const adminNavItems: PortalNavItem[] = [
  { id: "dashboard", label: "Dashboard", path: RoutePaths.dashboard, icon: DashboardOutlinedIcon },
  { id: "dashboard-recent", label: "Recent Assessments", path: RoutePaths.dashboardRecent, icon: AssessmentOutlinedIcon },
  { id: "dashboard-export", label: "Export Center", path: RoutePaths.dashboardExport, icon: DownloadOutlinedIcon },
  { id: "dashboard-scoring", label: "Scoring Policy", path: RoutePaths.dashboardScoring, icon: RuleOutlinedIcon },
  { id: "dashboard-templates", label: "Intensity Templates", path: RoutePaths.dashboardTemplates, icon: GridViewOutlinedIcon },
  { id: "dashboard-audit", label: "Audit & Governance", path: RoutePaths.dashboardAudit, icon: HistoryEduOutlinedIcon },
  { id: "authentication", label: "Authentication", path: RoutePaths.authentication, icon: AdminPanelSettingsOutlinedIcon },
  { id: "assessment", label: "Assessment", path: RoutePaths.assessments, icon: AssignmentOutlinedIcon },
  { id: "exam-takers", label: "Exam Takers", path: RoutePaths.examTakers, icon: GroupsOutlinedIcon },
  { id: "question-bank", label: "Question Bank", path: RoutePaths.questionBank, icon: QuizOutlinedIcon },
  { id: "structure", label: "Structure", path: RoutePaths.structure, icon: AccountTreeOutlinedIcon },
  { id: "reports", label: "Reports", path: RoutePaths.reports, icon: AssessmentOutlinedIcon },
  { id: "settings", label: "Settings", path: RoutePaths.settings, icon: SettingsOutlinedIcon },
];
