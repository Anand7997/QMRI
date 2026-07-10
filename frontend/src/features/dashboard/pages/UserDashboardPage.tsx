import { Alert, Box, Button, Card, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { EmptyState, MaturityChip, StatusChip, type EntityStatus } from "shared/components";
import { AssessmentStatus, assessmentStatusLabel } from "shared/api/types";
import { RoutePaths } from "shared/constants/routePaths";
import { useAuthContext } from "contexts/AuthContext";
import { brandTokens, dataTokens, semanticTokens } from "app/theme/tokens/palette";
import { StatCard } from "../components/StatCard";
import { ProgressRing } from "../components/ProgressRing";
import { MotionItem, MotionReveal, MotionStagger } from "../components/dashboardMotion";
import { useAssessmentDashboardData } from "../assessmentData";

export function UserDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const dashboard = useAssessmentDashboardData();

  const firstName = (user?.userName ?? "there").split(/[.\s@]/)[0];
  const greetingName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const activeAssessments = useMemo(
    () =>
      [...dashboard.assessments]
        .filter(
          (assessment) =>
            assessment.status === AssessmentStatus.InProgress || assessment.status === AssessmentStatus.Draft,
        )
        .sort((a, b) => new Date(resolveDate(b)).getTime() - new Date(resolveDate(a)).getTime()),
    [dashboard.assessments],
  );
  const activeAssessment = activeAssessments[0];
  const latestScore = dashboard.recentAssessments.find((assessment) => assessment.score != null)?.score ?? 0;

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        {dashboard.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
        {dashboard.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Unable to load your assessment data.
          </Alert>
        ) : null}

        {/* Greeting / continue hero */}
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
              bottom: -80,
              right: -20,
              width: 260,
              height: 260,
              borderRadius: "50%",
              background: alpha("#ffffff", 0.08),
            }}
          />
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems={{ md: "center" }}
            justifyContent="space-between"
            sx={{ position: "relative" }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: alpha("#fff", 0.85), fontWeight: 700 }}>
                Welcome back
              </Typography>
              <Typography variant="h1" sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, fontWeight: 700 }}>
                Hello, {greetingName}
              </Typography>
              {activeAssessment ? (
                <>
                  <Typography variant="body1" sx={{ mt: 0.5, color: alpha("#fff", 0.85) }}>
                    Continue where you left off - <b>{activeAssessment.title}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha("#fff", 0.7) }}>
                    {activeAssessment.answeredCount} / {activeAssessment.questionCount} answered
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() =>
                        navigate(RoutePaths.portalAssessments, { state: { assessmentId: activeAssessment.assessmentId } })
                      }
                      sx={{
                        bgcolor: "#fff",
                        color: brandTokens.blue700,
                        minHeight: 44,
                        px: 2.5,
                        "&:hover": { bgcolor: brandTokens.blue50 },
                      }}
                    >
                      View assessment
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="body1" sx={{ mt: 0.5, color: alpha("#fff", 0.85), maxWidth: 460 }}>
                    No assessment is assigned to you. New assignments appear here as soon as they are created.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<RocketLaunchOutlinedIcon />}
                      onClick={() => navigate(RoutePaths.portalAssessments)}
                      sx={{
                        bgcolor: "#fff",
                        color: brandTokens.blue700,
                        minHeight: 44,
                        px: 2.5,
                        "&:hover": { bgcolor: brandTokens.blue50 },
                      }}
                    >
                      View my assessments
                    </Button>
                  </Box>
                </>
              )}
            </Box>

            {activeAssessment ? (
              <ProgressRing
                value={activeAssessment.completionPercentage}
                color="#fff"
                track={alpha("#ffffff", 0.25)}
              />
            ) : null}
          </Stack>
        </MotionReveal>

        {/* Stats */}
        <MotionStagger
          sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}
        >
          <StatCard
            label="Assigned"
            value={activeAssessments.length}
            icon={<AssignmentOutlinedIcon />}
            accent={brandTokens.blue600}
          />
          <StatCard
            label="Completed"
            value={dashboard.completedCount}
            icon={<TaskAltOutlinedIcon />}
            accent={semanticTokens.successMain}
          />
          <StatCard
            label="Last score"
            value={latestScore}
            icon={<SpeedOutlinedIcon />}
            accent={dataTokens.bandIQ}
            footer={<MaturityChip score={latestScore} />}
          />
        </MotionStagger>

        {/* My assessments */}
        <MotionReveal delay={0.2} sx={{ mt: 2 }}>
          <Card>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2 }}>
              <Typography variant="h3">My assessments</Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(RoutePaths.portalAssessments)}
              >
                View all
              </Button>
            </Stack>
            {activeAssessments.length === 0 ? (
              <EmptyState
                title="No assessment is assigned to you"
                description="Completed assessments are available in History and Reports."
              />
            ) : (
              <MotionStagger>
                {activeAssessments.map((assessment) => (
                  <MotionItem
                    key={assessment.assessmentId}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      px: 2.5,
                      py: 1.75,
                      cursor: "pointer",
                      transition: "background-color 200ms",
                      borderTop: "1px solid",
                      borderColor: "divider",
                      "&:first-of-type": { borderTop: "none" },
                      "&:hover": { bgcolor: alpha(brandTokens.blue600, 0.06) },
                    }}
                    onClick={() => navigate(RoutePaths.portalAssessments, { state: { assessmentId: assessment.assessmentId } })}
                  >
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body1" fontWeight={600} noWrap>
                        {assessment.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Updated {formatDate(resolveDate(assessment))}
                      </Typography>
                    </Box>
                    <StatusChip status={toEntityStatus(assessment.status)} />
                    <ArrowForwardIcon fontSize="small" sx={{ color: "text.disabled" }} />
                  </MotionItem>
                ))}
              </MotionStagger>
            )}
          </Card>
        </MotionReveal>
      </Box>
    </MotionConfig>
  );
}

function toEntityStatus(status: number): EntityStatus {
  const label = assessmentStatusLabel[status] as EntityStatus | undefined;
  return label ?? "Draft";
}

function resolveDate(assessment: {
  scoredAtUtc?: string | null;
  submittedAtUtc?: string | null;
  startedAtUtc?: string | null;
  createdAtUtc: string;
}) {
  return assessment.scoredAtUtc ?? assessment.submittedAtUtc ?? assessment.startedAtUtc ?? assessment.createdAtUtc;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}