import { Alert, Box, Button, Card, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { useNavigate } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { MaturityChip } from "shared/components";
import { RoutePaths } from "shared/constants/routePaths";
import { brandTokens, dataTokens, semanticTokens } from "app/theme/tokens/palette";
import { MaturityRadar } from "../components/MaturityRadar";
import { BandDonut } from "../components/BandDonut";
import { RecentAssessments } from "../components/RecentAssessments";
import { TopRecommendations } from "../components/TopRecommendations";
import { StatCard } from "../components/StatCard";
import { MotionReveal, MotionStagger } from "../components/dashboardMotion";
import { useAssessmentDashboardData } from "../assessmentData";

export function DashboardPage() {
  const navigate = useNavigate();
  const dashboard = useAssessmentDashboardData();

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        {/* Hero header */}
        <MotionReveal
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 3,
            p: { xs: 2.5, md: 3.5 },
            mb: 2.5,
            color: "#fff",
            background: `linear-gradient(120deg, ${brandTokens.blue700} 0%, ${brandTokens.blue500} 100%)`,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -60,
              right: -30,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: alpha("#ffffff", 0.1),
            }}
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            sx={{ position: "relative" }}
          >
            <Box>
              <Typography variant="overline" sx={{ color: alpha("#fff", 0.85), fontWeight: 700 }}>
                Administration Console
              </Typography>
              <Typography variant="h1" sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, fontWeight: 700 }}>
                Maturity Dashboard
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, color: alpha("#fff", 0.85), maxWidth: 520 }}>
                TOPP QA maturity overview built from live assessment data.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(RoutePaths.assessments, { state: { openCreate: true } })}
              sx={{
                bgcolor: "#fff",
                color: brandTokens.blue700,
                minHeight: 44,
                px: 2.5,
                "&:hover": { bgcolor: brandTokens.blue50 },
              }}
            >
              New assessment
            </Button>
          </Stack>
        </MotionReveal>

        {dashboard.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
        {dashboard.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Unable to load assessment dashboard data.
          </Alert>
        ) : null}

        {/* KPI row */}
        <MotionStagger
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          }}
        >
          <StatCard
            label="Assessments"
            value={dashboard.assessmentCount}
            icon={<AssignmentTurnedInOutlinedIcon />}
            accent={brandTokens.blue600}
          />
          <StatCard
            label="In progress"
            value={dashboard.inProgressCount}
            icon={<PendingActionsOutlinedIcon />}
            accent={dataTokens.bandQA}
          />
          <StatCard
            label="Avg maturity"
            value={dashboard.overallScore}
            icon={<SpeedOutlinedIcon />}
            accent={dataTokens.bandIQ}
            footer={<MaturityChip score={dashboard.overallScore} />}
          />
          <StatCard
            label="Completion"
            value={dashboard.averageCompletion}
            format={(n) => `${Math.round(n)}%`}
            icon={<TaskAltOutlinedIcon />}
            accent={semanticTokens.successMain}
          />
        </MotionStagger>

        <MotionReveal delay={0.1} sx={{ mt: 2 }}>
          <Card sx={{ p: 2.5 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexGrow: 1 }}>
                <GroupsOutlinedIcon color="primary" />
                <Box>
                  <Typography variant="h3">Exam Takers</Typography>
                  <Typography variant="body2" color="text.secondary">
                    See who has not started, who is progressing, and who has finished each assignment.
                  </Typography>
                </Box>
              </Stack>
              <Button variant="outlined" onClick={() => navigate(RoutePaths.examTakers)}>
                Open panel
              </Button>
            </Stack>
          </Card>
        </MotionReveal>

        {/* Charts */}
        <Box
          sx={{
            display: "grid",
            gap: 2,
            mt: 2,
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          }}
        >
          <MotionReveal delay={0.15} sx={{ minWidth: 0 }}>
            <MaturityRadar data={dashboard.categoryScores} />
          </MotionReveal>
          <MotionReveal delay={0.22} sx={{ minWidth: 0 }}>
            <BandDonut data={dashboard.bandDistribution} />
          </MotionReveal>
        </Box>

        {/* Tables */}
        <Box
          sx={{
            display: "grid",
            gap: 2,
            mt: 2,
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          }}
        >
          <MotionReveal delay={0.28} sx={{ minWidth: 0 }}>
            <RecentAssessments rows={dashboard.recentAssessments} />
          </MotionReveal>
          <MotionReveal delay={0.34} sx={{ minWidth: 0 }}>
            <TopRecommendations items={dashboard.topRecommendations} />
          </MotionReveal>
        </Box>
      </Box>
    </MotionConfig>
  );
}
