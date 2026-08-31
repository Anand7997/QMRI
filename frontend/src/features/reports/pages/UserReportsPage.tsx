import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import { alpha } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { EmptyState, MetricTile, PageHeader } from "shared/components";
import { useAssessment, useAssessments } from "shared/api/assessments";
import { AssessmentStatus } from "shared/api/types";
import { brandTokens, dataTokens, neutralTokens, semanticTokens } from "app/theme/tokens/palette";
import { MotionReveal } from "features/dashboard/components/dashboardMotion";
import { useAuthContext } from "contexts/AuthContext";
import { ReportDetailPage } from "../components/ReportDetailPage";
import { formatDate, resolveDate, stageForScore, stageLabelForAverage, type StageInfo } from "../components/reportAnalytics";

type ReportRouteState = {
  assessmentId?: string;
  focus?: "steps";
};

export function UserReportsPage() {
  const { user } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const assessmentsQuery = useAssessments(user?.userId);
  const reports = useMemo(
    () => (assessmentsQuery.data ?? [])
      .filter((assessment) => assessment.status === AssessmentStatus.Scored)
      .sort((a, b) => new Date(resolveDate(b)).getTime() - new Date(resolveDate(a)).getTime()),
    [assessmentsQuery.data],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [focusSteps, setFocusSteps] = useState(false);
  const selectedSummary = reports.find((assessment) => assessment.assessmentId === selectedId);
  const routeState = location.state as ReportRouteState | null;
  const routeAssessmentId = routeState?.assessmentId;
  const routeFocus = routeState?.focus;
  const detailQuery = useAssessment(selectedId);

  const summary = useMemo(() => {
    if (reports.length === 0) {
      return { count: 0, avgScore: 0, bestScore: 0, avgStageLevel: 0, avgStageLabel: "No reports" };
    }
    const scores = reports.map((assessment) => Math.round(assessment.overallScore ?? 0));
    const avgStageLevel = scores.reduce((sum, score) => sum + stageForScore(score).level, 0) / scores.length;
    return {
      count: reports.length,
      avgScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      bestScore: Math.max(...scores),
      avgStageLevel,
      avgStageLabel: stageLabelForAverage(avgStageLevel),
    };
  }, [reports]);

  useEffect(() => {
    if (!routeAssessmentId) return;
    if (!reports.some((assessment) => assessment.assessmentId === routeAssessmentId)) return;

    setSelectedId(routeAssessmentId);
    setFocusSteps(routeFocus === "steps");
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, navigate, reports, routeAssessmentId, routeFocus]);

  if (selectedSummary) {
    return (
      <ReportDetailPage
        assessment={selectedSummary}
        detailQuery={detailQuery}
        history={reports}
        focusSteps={focusSteps}
        actor={user?.userId}
        onBack={() => {
          setSelectedId(undefined);
          setFocusSteps(false);
        }}
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        <PageHeader
          title="Assessment reports"
          subtitle="Completed assessments with maturity stage, score and detailed step-by-step breakdown."
        />

        {assessmentsQuery.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
        {assessmentsQuery.isError ? <Alert severity="error" sx={{ mb: 2 }}>Unable to load your report data.</Alert> : null}

        {reports.length === 0 && !assessmentsQuery.isLoading ? (
          <Card sx={{ p: 4 }}>
            <EmptyState title="No completed reports" description="Assessment reports appear here after you submit and score an assessment." />
          </Card>
        ) : (
          <>
            <MotionReveal sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
              <MetricTile label="Reports" value={summary.count} icon={<AssessmentOutlinedIcon fontSize="inherit" />} accent={brandTokens.blue600} />
              <MetricTile label="Average stage" value={summary.avgStageLevel} format={(n) => `${n.toFixed(1)}/5`} sub={<Typography variant="caption" color="text.secondary">{summary.avgStageLabel}</Typography>} icon={<SpeedOutlinedIcon fontSize="inherit" />} accent={semanticTokens.infoMain} />
              <MetricTile label="Average score" value={summary.avgScore} format={(n) => `${Math.round(n)}%`} icon={<SpeedOutlinedIcon fontSize="inherit" />} accent={dataTokens.bandQE} />
              <MetricTile label="Best score" value={summary.bestScore} format={(n) => `${Math.round(n)}%`} icon={<EmojiEventsOutlinedIcon fontSize="inherit" />} accent={dataTokens.bandIQ} />
            </MotionReveal>

            <MotionReveal delay={0.08} sx={{ mt: 2 }}>
              <Card>
                <Stack sx={{ px: 2.5, py: 2 }}>
                  <Typography variant="h3">Completed assessments</Typography>
                  <Typography variant="body2" color="text.secondary">Open a row to see the visual dashboard, insights, recommendations, and step-by-step detail.</Typography>
                </Stack>
                <Divider />
                <TableContainer>
                  <Table aria-label="Assessment report summaries" sx={{ minWidth: 760 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Assessment name</TableCell>
                        <TableCell>Date taken</TableCell>
                        <TableCell>Maturity stage</TableCell>
                        <TableCell sx={{ minWidth: 180 }}>Overall score</TableCell>
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((assessment) => {
                        const score = Math.round(assessment.overallScore ?? 0);
                        const stage = stageForScore(score);
                        return (
                          <TableRow
                            key={assessment.assessmentId}
                            hover
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedId(assessment.assessmentId)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedId(assessment.assessmentId);
                              }
                            }}
                            aria-label={`View detailed report for ${assessment.title}`}
                            sx={{
                              cursor: "pointer",
                              "&:focus-visible": { outline: `2px solid ${alpha(brandTokens.blue500, 0.5)}`, outlineOffset: -2 },
                            }}
                          >
                            <TableCell><Typography variant="body2" fontWeight={700}>{assessment.title}</Typography></TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>{formatDate(resolveDate(assessment))}</TableCell>
                            <TableCell>
                              <StageChip stage={stage} />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1.25}>
                                <LinearProgress
                                  variant="determinate"
                                  value={score}
                                  sx={{ flexGrow: 1, height: 6, borderRadius: 999, bgcolor: neutralTokens.line200, "& .MuiLinearProgress-bar": { bgcolor: stage.color } }}
                                />
                                <Typography variant="body2" fontWeight={800} sx={{ minWidth: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{score}%</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right"><ArrowForwardIcon fontSize="small" sx={{ color: brandTokens.blue600, verticalAlign: "middle" }} /></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </MotionReveal>
          </>
        )}
      </Box>
    </MotionConfig>
  );
}

function StageChip({ stage }: { stage: StageInfo }) {
  return (
    <Chip
      size="small"
      label={`${stage.level}/5 - ${stage.label}`}
      variant="outlined"
      sx={{ fontWeight: 700, borderColor: alpha(stage.color, 0.35), color: stage.color, bgcolor: alpha(stage.color, 0.08) }}
    />
  );
}
