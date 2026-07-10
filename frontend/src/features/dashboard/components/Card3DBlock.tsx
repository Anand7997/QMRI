import { useCallback, useState, type ReactNode } from "react";
import { Badge, Box, Card, Typography } from "@mui/material";
import { motion } from "motion/react";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { RoutePaths } from "shared/constants/routePaths";

const MotionCard = motion.create(Card);

export interface Card3DBlockProps {
  title: string;
  description: string;
  icon: ReactNode;
  gradient: string;
  onClick?: () => void;
  /** Shows a bell badge in the corner when greater than 0 (e.g. newly assigned items). */
  badgeCount?: number;
}

interface MousePos {
  x: number;
  y: number;
}

export function Card3DBlock({ title, description, icon, gradient, onClick, badgeCount }: Card3DBlockProps) {
  const [mousePos, setMousePos] = useState<MousePos>({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePos({
      x: (x / rect.width - 0.5) * 20,
      y: (y / rect.height - 0.5) * -20,
    });
  }, []);

  const handleLeave = useCallback(() => {
    setHovered(false);
    setMousePos({ x: 0, y: 0 });
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onClick) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <MotionCard
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : -1}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      animate={{
        rotateX: mousePos.y,
        rotateY: mousePos.x,
        y: hovered ? -6 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.7 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      sx={{
        position: "relative",
        overflow: "hidden",
        height: 200,
        p: 3,
        color: "#fff",
        background: gradient,
        cursor: onClick ? "pointer" : "default",
        transformStyle: "preserve-3d",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        "&:hover": { boxShadow: "0 18px 40px rgba(0,0,0,0.28)" },
      }}
      style={{ perspective: 1000 }}
    >
      {/* corner accent */}
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.08)",
        }}
      />

      {badgeCount ? (
        <Badge
          badgeContent={badgeCount}
          color="error"
          overlap="circular"
          sx={{ position: "absolute", top: 18, right: 20, zIndex: 2 }}
        >
          <motion.div
            animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
          >
            <NotificationsNoneIcon sx={{ color: "#fff" }} />
          </motion.div>
        </Badge>
      ) : null}

      {/* hover glow */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
        }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <Box sx={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box sx={{ fontSize: 32, opacity: 0.9, display: "flex" }}>{icon}</Box>
        <Box>
          <Typography variant="h3" sx={{ color: "#fff", mb: 0.75 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
            {description}
          </Typography>
        </Box>
      </Box>
    </MotionCard>
  );
}

const GRADIENTS = {
  slate: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
  blue: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)",
  purple: "linear-gradient(135deg, #7e22ce 0%, #4c1d95 100%)",
  emerald: "linear-gradient(135deg, #059669 0%, #064e3b 100%)",
  amber: "linear-gradient(135deg, #b45309 0%, #78350f 100%)",
  rose: "linear-gradient(135deg, #be123c 0%, #881337 100%)",
  cyan: "linear-gradient(135deg, #0e7490 0%, #164e63 100%)",
} as const;

export interface DashboardBlockDef {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  gradient: string;
  route: string;
}

export const dashboardBlocks: DashboardBlockDef[] = [
  {
    id: "authentication",
    title: "Authentication",
    description: "Manage user accounts, roles, and access permissions.",
    icon: <AdminPanelSettingsOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.slate,
    route: RoutePaths.authentication,
  },
  {
    id: "assessment",
    title: "Assessment",
    description: "Create, assign, and track QA maturity assessments.",
    icon: <AssignmentOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.blue,
    route: RoutePaths.assessments,
  },
  {
    id: "exam-takers",
    title: "Exam Takers",
    description: "See who hasn't started, who's in progress, and who has finished.",
    icon: <GroupsOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.purple,
    route: RoutePaths.examTakers,
  },
  {
    id: "question-bank",
    title: "Question Bank",
    description: "Build and organize the question library used across assessments.",
    icon: <QuizOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.emerald,
    route: RoutePaths.questionBank,
  },
  {
    id: "structure",
    title: "Structure",
    description: "Configure maturity categories, dimensions, and scoring structure.",
    icon: <AccountTreeOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.amber,
    route: RoutePaths.structure,
  },
  {
    id: "reports",
    title: "Reports",
    description: "Review maturity trends and generate assessment reports.",
    icon: <AssessmentOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.rose,
    route: RoutePaths.reports,
  },
  {
    id: "settings",
    title: "Settings",
    description: "Manage account, organization, and system preferences.",
    icon: <SettingsOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.cyan,
    route: RoutePaths.settings,
  },
];

export const userDashboardBlocks: DashboardBlockDef[] = [
  {
    id: "my-assessments",
    title: "My Assessments",
    description: "View and continue assessments assigned to you.",
    icon: <AssignmentOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.blue,
    route: RoutePaths.portalAssessments,
  },
  {
    id: "history",
    title: "History",
    description: "Look back at assessments you've completed.",
    icon: <HistoryOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.purple,
    route: RoutePaths.portalHistory,
  },
  {
    id: "reports",
    title: "Reports",
    description: "Review your maturity scores and generated reports.",
    icon: <AssessmentOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.emerald,
    route: RoutePaths.portalReports,
  },
  {
    id: "profile",
    title: "Profile",
    description: "Update your personal information and account details.",
    icon: <PersonOutlineIcon fontSize="inherit" />,
    gradient: GRADIENTS.amber,
    route: RoutePaths.portalProfile,
  },
  {
    id: "settings",
    title: "Settings",
    description: "Manage your preferences and account settings.",
    icon: <SettingsOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.cyan,
    route: RoutePaths.portalSettings,
  },
];
