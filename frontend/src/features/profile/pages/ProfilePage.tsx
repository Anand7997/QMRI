import { Box, Card, Chip, Stack, Typography } from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import { useAuthContext } from "contexts/AuthContext";
import { PageHeader, MaturityChip } from "shared/components";
import { brandTokens, dataTokens } from "app/theme/tokens/palette";
import { StatCard } from "features/dashboard/components/StatCard";
import { MotionStagger } from "features/dashboard/components/dashboardMotion";
import { useAssessmentDashboardData } from "features/dashboard/assessmentData";

export function ProfilePage() {
  const { user } = useAuthContext();
  const dashboard = useAssessmentDashboardData(user?.userId);

  const displayName = user?.fullName || user?.userName || "Portal User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Box>
      <PageHeader title="Profile" subtitle="Your account details and assessment activity." />

      <Card sx={{ p: 2.5, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems={{ sm: "center" }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              flexShrink: 0,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
              background: `linear-gradient(135deg, ${brandTokens.blue600}, ${brandTokens.blue700})`,
            }}
          >
            {initial}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" noWrap>
              {displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user?.email ?? "user@qmri.app"}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {(user?.roles ?? ["USER"]).map((role) => (
                <Chip key={role} label={role} size="small" color="primary" variant="outlined" />
              ))}
              {user?.approvalStatus ? <Chip label={user.approvalStatus} size="small" variant="outlined" /> : null}
            </Stack>
          </Box>
        </Stack>
      </Card>

      <MotionStagger sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
        <StatCard
          label="Assigned"
          value={dashboard.assessmentCount}
          icon={<AssignmentOutlinedIcon />}
          accent={brandTokens.blue600}
        />
        <StatCard
          label="Completed"
          value={dashboard.completedCount}
          icon={<TaskAltOutlinedIcon />}
          accent={dataTokens.bandQA}
        />
        <StatCard
          label="Avg maturity"
          value={dashboard.overallScore}
          icon={<SpeedOutlinedIcon />}
          accent={dataTokens.bandIQ}
          footer={<MaturityChip score={dashboard.overallScore} />}
        />
      </MotionStagger>
    </Box>
  );
}
