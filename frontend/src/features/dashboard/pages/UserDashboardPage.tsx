import { Alert, Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { AssessmentStatus } from "shared/api/types";
import { RoutePaths } from "shared/constants/routePaths";
import { useAuthContext } from "contexts/AuthContext";
import { brandTokens } from "app/theme/tokens/palette";
import { ProgressRing } from "../components/ProgressRing";
import { Card3DBlock, userDashboardBlocks } from "../components/Card3DBlock";
import { MotionReveal } from "../components/dashboardMotion";
import { useAssessmentDashboardData } from "../assessmentData";
import { DueDateReminderWidget } from "../components/DueDateReminderWidget";
import { loadResumePointer } from "../governance/dashboardGovernanceState";

export function UserDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const dashboard = useAssessmentDashboardData(user?.userId);

  const firstName = (user?.userName ?? "there").split(/[.\s@]/)[0];
  const greetingName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const resumePointer = loadResumePointer(user?.userId);

  const activeAssessments = useMemo(
    () =>
      [...dashboard.assessments]
        .filter(
          (assessment) =>
            assessment.status === AssessmentStatus.InProgress || assessment.status === AssessmentStatus.Draft,
        )
        .sort((a, b) => {
          if (resumePointer?.assessmentId === a.assessmentId) return -1;
          if (resumePointer?.assessmentId === b.assessmentId) return 1;
          return new Date(resolveDate(b)).getTime() - new Date(resolveDate(a)).getTime();
        }),
    [dashboard.assessments, resumePointer?.assessmentId],
  );

  const activeAssessment = activeAssessments[0];
  const isPendingActiveAssessment = activeAssessment?.status === AssessmentStatus.Draft;
  const newlyAssignedCount = useMemo(
    () => dashboard.assessments.filter((assessment) => assessment.status === AssessmentStatus.Draft).length,
    [dashboard.assessments],
  );

  const openAssessment = (assessmentId: string) => {
    navigate(RoutePaths.portalAssessments, { state: { assessmentId, resume: true } });
  };

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        {dashboard.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
        {dashboard.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Unable to load your assessment data.
          </Alert>
        ) : null}

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
                    {isPendingActiveAssessment ? (
                      <>A new assessment is waiting - <b>{activeAssessment.title}</b></>
                    ) : (
                      <>Continue where you left off - <b>{activeAssessment.title}</b></>
                    )}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha("#fff", 0.7) }}>
                    {activeAssessment.answeredCount} / {activeAssessment.questionCount} answered
                    {resumePointer?.assessmentId === activeAssessment.assessmentId ? " - saved position ready" : ""}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => openAssessment(activeAssessment.assessmentId)}
                      sx={{
                        bgcolor: "#fff",
                        color: brandTokens.blue700,
                        minHeight: 44,
                        px: 2.5,
                        "&:hover": { bgcolor: brandTokens.blue50 },
                      }}
                    >
                      {isPendingActiveAssessment ? "Start assessment" : "Continue assessment"}
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

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
            gridAutoRows: { lg: "168px" },
          }}
        >
          <MotionReveal sx={{ gridColumn: { xs: "1 / -1", lg: "span 1" }, gridRow: { lg: "span 2" } }}>
            <DueDateReminderWidget assessments={dashboard.assessments} onOpenAssessment={openAssessment} />
          </MotionReveal>

          {userDashboardBlocks.map((block) => (
            <Card3DBlock
              key={block.id}
              title={block.title}
              description={block.description}
              icon={block.icon}
              gradient={block.gradient}
              onClick={() => navigate(block.route)}
              badgeCount={block.id === "my-assessments" ? newlyAssignedCount : undefined}
            />
          ))}
        </Box>
      </Box>
    </MotionConfig>
  );
}

function resolveDate(assessment: {
  scoredAtUtc?: string | null;
  submittedAtUtc?: string | null;
  startedAtUtc?: string | null;
  createdAtUtc: string;
}) {
  return assessment.scoredAtUtc ?? assessment.submittedAtUtc ?? assessment.startedAtUtc ?? assessment.createdAtUtc;
}






