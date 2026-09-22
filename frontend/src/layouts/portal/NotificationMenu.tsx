import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "contexts/AuthContext";
import { useAssessments } from "shared/api/assessments";
import { AssessmentStatus } from "shared/api/types";
import { RoutePaths } from "shared/constants/routePaths";
import { collapseAssessmentsByAssignment } from "shared/domain/assessmentGrouping";
import { isAssessmentExpired, resolveDueDate } from "features/dashboard/governance/dashboardGovernanceState";

interface AssessmentNotification {
  assessmentId: string;
  primary: string;
  secondary: string;
}

export function NotificationMenu() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthContext();
  const assessmentsQuery = useAssessments(user?.userId, !isAdmin && Boolean(user?.userId));
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const open = Boolean(anchorEl);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const notifications = useMemo<AssessmentNotification[]>(() => {
    if (isAdmin) {
      return [];
    }

    const assessments = collapseAssessmentsByAssignment(assessmentsQuery.data ?? [])
      .filter(
        (assessment) =>
          (assessment.status === AssessmentStatus.Draft || assessment.status === AssessmentStatus.InProgress)
          && !isAssessmentExpired(assessment, now),
      );

    const assignedNotifications = assessments
      .filter((assessment) => assessment.status === AssessmentStatus.Draft)
      .map((assessment) => ({
        assessmentId: assessment.assessmentId,
        primary: "Assessment assigned",
        secondary: `${assessment.title} · Due ${formatDate(resolveDueDate(assessment))}`,
      }));

    const dueSoonNotifications = assessments
      .filter((assessment) => assessment.status === AssessmentStatus.InProgress)
      .map((assessment) => ({
        assessment,
        daysLeft: Math.ceil((new Date(resolveDueDate(assessment)).getTime() - now) / (1000 * 60 * 60 * 24)),
      }))
      .filter(({ daysLeft }) => daysLeft <= 3)
      .map(({ assessment, daysLeft }) => ({
        assessmentId: assessment.assessmentId,
        primary: daysLeft < 0 ? "Assessment overdue" : "Assessment due soon",
        secondary: `${assessment.title} · ${daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `Due ${formatDate(resolveDueDate(assessment))}`}`,
      }));

    return [...assignedNotifications, ...dueSoonNotifications];
  }, [assessmentsQuery.data, isAdmin, now]);

  const openAssessment = (assessmentId: string) => {
    setAnchorEl(null);
    navigate(RoutePaths.portalAssessments, { state: { assessmentId, resume: true } });
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          aria-label="Show notifications"
          aria-controls={open ? "notification-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          color="inherit"
        >
          <Badge badgeContent={notifications.length} color="error" showZero={false}>
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 320, maxHeight: 420 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Notifications
          </Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="No new notifications" />
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem key={`${notification.assessmentId}-${notification.primary}`} onClick={() => openAssessment(notification.assessmentId)}>
              <ListItemText primary={notification.primary} secondary={notification.secondary} />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
