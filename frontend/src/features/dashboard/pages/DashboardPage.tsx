import { Alert, Box, Dialog, DialogContent, DialogTitle, IconButton, LinearProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import { type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "contexts/AuthContext";
import { useUsers } from "shared/api/users";
import { RecentAssessments } from "../components/RecentAssessments";
import { Card3DBlock, dashboardBlocks } from "../components/Card3DBlock";
import { useAssessmentDashboardData } from "../assessmentData";
import { AuditGovernanceFeed } from "../components/AuditGovernanceFeed";
import { ExportCenter } from "../components/ExportCenter";
import { IntensityTemplateManager } from "../components/IntensityTemplateManager";
import { ScoringPolicyManager } from "../components/ScoringPolicyManager";
import { RoutePaths } from "shared/constants/routePaths";

type AdminDashboardPanel = "recent" | "export" | "scoring" | "templates" | "audit" | null;

const adminFeatureBlocks = [
  {
    id: "recent" as const,
    route: RoutePaths.dashboardRecent,
    title: "Recent Assessments",
    description: "Review the latest assessment activity and status movement.",
    icon: <AssessmentOutlinedIcon fontSize="inherit" />,
    gradient: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
  },
  {
    id: "export" as const,
    route: RoutePaths.dashboardExport,
    title: "Admin Export Center",
    description: "Generate filtered PDF, Excel, and CSV exports with branding.",
    icon: <DownloadOutlinedIcon fontSize="inherit" />,
    gradient: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
  },
  {
    id: "scoring" as const,
    route: RoutePaths.dashboardScoring,
    title: "Scoring Policy Manager",
    description: "Configure pass marks, recommendation bands, and pillar weights.",
    icon: <RuleOutlinedIcon fontSize="inherit" />,
    gradient: "linear-gradient(135deg, #9333ea 0%, #581c87 100%)",
  },
  {
    id: "templates" as const,
    route: RoutePaths.dashboardTemplates,
    title: "Intensity Templates",
    description: "Manage Operational, Strategic, and Tactical question ranges.",
    icon: <GridViewOutlinedIcon fontSize="inherit" />,
    gradient: "linear-gradient(135deg, #b45309 0%, #78350f 100%)",
  },
  {
    id: "audit" as const,
    route: RoutePaths.dashboardAudit,
    title: "Audit & Governance",
    description: "Track changes to questions, scoring, templates, and exports.",
    icon: <HistoryEduOutlinedIcon fontSize="inherit" />,
    gradient: "linear-gradient(135deg, #475569 0%, #111827 100%)",
  },
];

export function DashboardPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const dashboard = useAssessmentDashboardData();
  const pendingUsersQuery = useUsers("Pending");
  const pendingSignupCount = pendingUsersQuery.data?.length ?? 0;
  const activePanel = panelFromPathname(pathname);

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        {dashboard.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
        {dashboard.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Unable to load assessment dashboard data.
          </Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          }}
        >
          {adminFeatureBlocks.map((block) => (
            <Card3DBlock
              key={block.id}
              title={block.title}
              description={block.description}
              icon={block.icon}
              gradient={block.gradient}
              onClick={() => navigate(block.route)}
            />
          ))}

          {dashboardBlocks.map((block) => (
            <Card3DBlock
              key={block.id}
              title={block.title}
              description={block.description}
              icon={block.icon}
              gradient={block.gradient}
              badgeCount={block.id === "authentication" ? pendingSignupCount : undefined}
              onClick={() => navigate(block.route)}
            />
          ))}
        </Box>

        <DashboardPanelDialog
          title={dialogTitle(activePanel)}
          open={Boolean(activePanel)}
          onClose={() => navigate(RoutePaths.dashboard, { replace: true })}
        >
          {activePanel === "recent" ? <RecentAssessments rows={dashboard.recentAssessments} /> : null}
          {activePanel === "export" ? (
            <ExportCenter
              title="Admin Export Center"
              scope="Admin"
              assessments={dashboard.assessments}
              details={dashboard.details}
              actor={user?.fullName || user?.userName || "Admin"}
            />
          ) : null}
          {activePanel === "scoring" ? <ScoringPolicyManager /> : null}
          {activePanel === "templates" ? <IntensityTemplateManager /> : null}
          {activePanel === "audit" ? <AuditGovernanceFeed /> : null}
        </DashboardPanelDialog>
      </Box>
    </MotionConfig>
  );
}

function DashboardPanelDialog({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pr: 7 }}>
        {title}
        <IconButton aria-label="Close" onClick={onClose} sx={{ position: "absolute", right: 12, top: 10 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}

function dialogTitle(panel: AdminDashboardPanel) {
  if (panel === "recent") return "Recent Assessments";
  if (panel === "export") return "Admin Export Center";
  if (panel === "scoring") return "Scoring Policy Manager";
  if (panel === "templates") return "Intensity Template Manager";
  if (panel === "audit") return "Audit & Governance Feed";
  return "Dashboard";
}

function panelFromPathname(pathname: string): AdminDashboardPanel {
  if (pathname === RoutePaths.dashboardRecent) return "recent";
  if (pathname === RoutePaths.dashboardExport) return "export";
  if (pathname === RoutePaths.dashboardScoring) return "scoring";
  if (pathname === RoutePaths.dashboardTemplates) return "templates";
  if (pathname === RoutePaths.dashboardAudit) return "audit";
  return null;
}

