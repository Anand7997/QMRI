import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import { alpha } from "@mui/material/styles";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { MotionConfig } from "motion/react";
import { EmptyState, MaturityChip, MetricTile, PageHeader, StatusChip, type EntityStatus } from "shared/components";
import { useAssessment, useAssessments } from "shared/api/assessments";
import {
  AssessmentStatus,
  ScoreScope,
  priorityLabel,
  type AssessmentScoreDto,
  type AssessmentSummaryDto,
} from "shared/api/types";
import { maturityFor } from "shared/domain/maturity";
import { brandTokens, dataTokens, neutralTokens, semanticTokens } from "app/theme/tokens/palette";
import { AnimatedNumber, MotionReveal } from "features/dashboard/components/dashboardMotion";
import { useAuthContext } from "contexts/AuthContext";

const PASS_SCORE = 70;

export function UserReportsPage() {
  const { user } = useAuthContext();
  const assessmentsQuery = useAssessments(user?.userId);
  const assessments = assessmentsQuery.data ?? [];
  const reports = useMemo(
    () =>
      assessments
        .filter((assessment) => assessment.status === AssessmentStatus.Scored)
        .sort((a, b) => new Date(resolveDate(b)).getTime() - new Date(resolveDate(a)).getTime()),
    [assessments],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const selectedSummary = reports.find((assessment) => assessment.assessmentId === selectedId);
  const detail = useAssessment(selectedId);

  const summary = useMemo(() => {
    if (reports.length === 0) {
      return { count: 0, passRate: 0, avgScore: 0, bestScore: 0 };
    }
    const scores = reports.map((r) => Math.round(r.overallScore ?? 0));
    const passed = scores.filter((s) => s >= PASS_SCORE).length;
    return {
      count: reports.length,
      passRate: Math.round((passed / reports.length) * 100),
      avgScore: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
      bestScore: Math.max(...scores),
    };
  }, [reports]);

  if (selectedSummary) {
    return (
      <ReportDetailPage assessment={selectedSummary} detailQuery={detail} onBack={() => setSelectedId(undefined)} />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        <PageHeader
          title="Assessment reports"
          subtitle="Completed assessments with result, score and detailed category breakdown."
        />

        {assessmentsQuery.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
        {assessmentsQuery.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Unable to load your report data.
          </Alert>
        ) : null}

        {reports.length === 0 && !assessmentsQuery.isLoading ? (
          <Card sx={{ p: 4 }}>
            <EmptyState
              title="No completed reports"
              description="Assessment reports appear here after you submit and score an assessment."
            />
          </Card>
        ) : (
          <>
            {/* Metrics */}
            <MotionReveal
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              }}
            >
              <MetricTile label="Reports" value={summary.count} icon={<AssessmentOutlinedIcon fontSize="inherit" />} accent={brandTokens.blue600} />
              <MetricTile
                label="Pass rate"
                value={summary.passRate}
                format={(n) => `${Math.round(n)}%`}
                icon={<PercentOutlinedIcon fontSize="inherit" />}
                accent={semanticTokens.successMain}
              />
              <MetricTile label="Average score" value={summary.avgScore} icon={<SpeedOutlinedIcon fontSize="inherit" />} accent={dataTokens.bandQE} />
              <MetricTile label="Best score" value={summary.bestScore} icon={<EmojiEventsOutlinedIcon fontSize="inherit" />} accent={dataTokens.bandIQ} />
            </MotionReveal>

            {/* Report table */}
            <MotionReveal delay={0.1} sx={{ mt: 2 }}>
              <Card>
                <Stack sx={{ px: 2.5, py: 2 }}>
                  <Typography variant="h3">Completed assessments</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select a row to open the full category and module report.
                  </Typography>
                </Stack>
                <Divider />
                <TableContainer>
                  <Table aria-label="Assessment report summaries" sx={{ minWidth: 720 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Assessment name</TableCell>
                        <TableCell>Date taken</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell sx={{ minWidth: 180 }}>Score</TableCell>
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((assessment) => {
                        const score = Math.round(assessment.overallScore ?? 0);
                        const passed = score >= PASS_SCORE;
                        const maturity = maturityFor(score);
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
                            aria-label={`View detailed scores for ${assessment.title}`}
                            sx={{
                              cursor: "pointer",
                              "&:focus-visible": {
                                outline: `2px solid ${alpha(brandTokens.blue500, 0.5)}`,
                                outlineOffset: -2,
                              },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={700}>
                                {assessment.title}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                              {formatDate(resolveDate(assessment))}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                icon={passed ? <CheckCircleOutlineIcon /> : <HighlightOffOutlinedIcon />}
                                label={passed ? "Pass" : "Fail"}
                                color={passed ? "success" : "error"}
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1.25}>
                                <LinearProgress
                                  variant="determinate"
                                  value={score}
                                  sx={{
                                    flexGrow: 1,
                                    height: 6,
                                    borderRadius: 999,
                                    bgcolor: neutralTokens.line200,
                                    "& .MuiLinearProgress-bar": { bgcolor: maturity.color },
                                  }}
                                />
                                <Typography variant="body2" fontWeight={800} sx={{ minWidth: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                                  {score}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <ArrowForwardIcon fontSize="small" sx={{ color: brandTokens.blue600, verticalAlign: "middle" }} />
                            </TableCell>
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

function ReportDetailPage({
  assessment,
  detailQuery,
  onBack,
}: {
  assessment: AssessmentSummaryDto;
  detailQuery: ReturnType<typeof useAssessment>;
  onBack: () => void;
}) {
  const selectedDetail = detailQuery.data;
  const overallScore = Math.round(assessment.overallScore ?? selectedDetail?.summary.overallScore ?? 0);
  const passed = overallScore >= PASS_SCORE;
  const resultColor = passed ? semanticTokens.successMain : semanticTokens.errorMain;
  const categoryScores = useMemo(() => buildCategoryScores(selectedDetail?.scores ?? []), [selectedDetail?.scores]);
  const recommendations = selectedDetail?.recommendations ?? [];
  const radarData = categoryScores.map((category) => ({ category: category.categoryName, score: category.score }));

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        <PageHeader
          title="Detailed report"
          subtitle="Category and module scores for the selected assessment."
          actions={
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>
              Back to reports
            </Button>
          }
        />

        {detailQuery.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
        {detailQuery.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Unable to load detailed score data.
          </Alert>
        ) : null}

        <Stack spacing={2}>
          {/* Result summary */}
          <MotionReveal>
            <Card sx={{ p: { xs: 2.5, md: 3 }, borderLeft: `4px solid ${resultColor}` }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ md: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {passed ? (
                      <CheckCircleOutlineIcon sx={{ color: resultColor }} />
                    ) : (
                      <HighlightOffOutlinedIcon sx={{ color: resultColor }} />
                    )}
                    <Typography variant="overline" sx={{ color: resultColor, fontWeight: 800 }}>
                      {passed ? "Passed" : "Below pass threshold"} · pass mark {PASS_SCORE}
                    </Typography>
                  </Stack>
                  <Typography variant="h2" sx={{ mt: 0.5 }}>
                    {assessment.title}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 1.25 }}>
                    <StatusChip status={toStatus(assessment.status)} />
                    <Chip size="small" variant="outlined" label={`Date taken ${formatDate(resolveDate(assessment))}`} />
                    <Chip size="small" variant="outlined" label={`${assessment.answeredCount}/${assessment.questionCount} answered`} />
                  </Stack>
                </Box>
                <Box sx={{ textAlign: { md: "right" }, minWidth: 140 }}>
                  <Stack direction="row" spacing={1.5} alignItems="baseline" justifyContent={{ md: "flex-end" }}>
                    <Typography sx={{ fontSize: { xs: 48, md: 60 }, fontWeight: 800, lineHeight: 0.9, color: resultColor, fontVariantNumeric: "tabular-nums" }}>
                      <AnimatedNumber value={overallScore} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      / 100
                    </Typography>
                  </Stack>
                  <Box sx={{ mt: 1 }}>
                    <MaturityChip score={overallScore} />
                  </Box>
                </Box>
              </Stack>
            </Card>
          </MotionReveal>

          {/* Radar + category breakdown */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: radarData.length >= 3 ? "minmax(280px, 1fr) 1.5fr" : "1fr" },
            }}
          >
            {radarData.length >= 3 ? (
              <MotionReveal delay={0.08} sx={{ minWidth: 0 }}>
                <Card sx={{ p: 2.5, height: "100%" }}>
                  <Typography variant="h3" sx={{ mb: 0.5 }}>
                    Category profile
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Score by category (0–100).
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke={neutralTokens.line200} />
                      <PolarAngleAxis dataKey="category" tick={{ fill: neutralTokens.ink500, fontSize: 12 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: neutralTokens.ink400, fontSize: 10 }} />
                      <Radar dataKey="score" stroke={brandTokens.blue600} fill={brandTokens.blue500} fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </MotionReveal>
            ) : null}

            <MotionReveal delay={0.12} sx={{ minWidth: 0 }}>
              <Card sx={{ height: "100%" }}>
                <Stack sx={{ px: 2.5, py: 2 }}>
                  <Typography variant="h3">Category and module scores</Typography>
                </Stack>
                <Divider />
                {categoryScores.length === 0 ? (
                  <EmptyState
                    title="No score details"
                    description="Detailed category and module scores were not returned for this assessment."
                  />
                ) : (
                  <Box sx={{ p: 2.5 }}>
                    <Stack spacing={2}>
                      {categoryScores.map((category) => (
                        <Box key={category.categoryId ?? category.categoryName}>
                          <ScoreRow
                            label={category.categoryName}
                            score={category.score}
                            answeredCount={category.answeredCount}
                            questionCount={category.questionCount}
                            prominent
                          />
                          {category.modules.length > 0 ? (
                            <Stack spacing={1} sx={{ mt: 1.25, pl: { xs: 0, md: 2 } }}>
                              {category.modules.map((module) => (
                                <ScoreRow
                                  key={module.moduleId ?? `${category.categoryName}-${module.moduleName}`}
                                  label={module.moduleName ?? "Module"}
                                  score={module.score}
                                  answeredCount={module.answeredCount}
                                  questionCount={module.questionCount}
                                />
                              ))}
                            </Stack>
                          ) : null}
                          <Divider sx={{ mt: 2 }} />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Card>
            </MotionReveal>
          </Box>

          {/* Recommendations */}
          <MotionReveal delay={0.16}>
            <Card>
              <Stack sx={{ px: 2.5, py: 2 }}>
                <Typography variant="h3">Recommendations</Typography>
              </Stack>
              <Divider />
              {recommendations.length === 0 ? (
                <EmptyState
                  title="No recommendations"
                  description="Recommendations appear when a category or module needs improvement."
                />
              ) : (
                <Stack spacing={1.5} sx={{ p: 2.5 }}>
                  {recommendations.map((recommendation) => (
                    <Stack key={recommendation.recommendationId} direction="row" spacing={1.5} alignItems="flex-start">
                      <LightbulbOutlinedIcon fontSize="small" color="primary" sx={{ mt: 0.25 }} />
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="body2" fontWeight={700}>
                            {recommendation.title}
                          </Typography>
                          <Chip size="small" variant="outlined" label={priorityLabel[recommendation.priority]} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {recommendation.categoryName ?? recommendation.moduleName ?? "Assessment"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {recommendation.description}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Card>
          </MotionReveal>
        </Stack>
      </Box>
    </MotionConfig>
  );
}

interface CategoryScoreGroup {
  categoryId?: string | null;
  categoryName: string;
  score: number;
  answeredCount: number;
  questionCount: number;
  modules: AssessmentScoreDto[];
}

function buildCategoryScores(scores: AssessmentScoreDto[]): CategoryScoreGroup[] {
  const categories = scores.filter((score) => score.scope === ScoreScope.Category);
  const modules = scores.filter((score) => score.scope === ScoreScope.Module);

  return categories.map((category) => ({
    categoryId: category.categoryId,
    categoryName: category.categoryName ?? "Category",
    score: Math.round(category.score),
    answeredCount: category.answeredCount,
    questionCount: category.questionCount,
    modules: modules
      .filter((module) => module.categoryId === category.categoryId)
      .sort((a, b) => (a.moduleName ?? "").localeCompare(b.moduleName ?? "")),
  }));
}

function ScoreRow({
  label,
  score,
  answeredCount,
  questionCount,
  prominent = false,
}: {
  label: string;
  score: number;
  answeredCount: number;
  questionCount: number;
  prominent?: boolean;
}) {
  const roundedScore = Math.round(score);
  const maturity = maturityFor(roundedScore);
  const passed = roundedScore >= PASS_SCORE;

  return (
    <Box
      sx={{
        p: prominent ? 1.5 : 1.25,
        border: 1,
        borderColor: prominent ? alpha(maturity.color, 0.35) : "divider",
        borderRadius: 2,
        bgcolor: prominent ? alpha(maturity.color, 0.06) : "background.paper",
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant={prominent ? "body1" : "body2"} fontWeight={prominent ? 800 : 700} noWrap>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {answeredCount} / {questionCount} answered
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" label={passed ? "Pass" : "Fail"} color={passed ? "success" : "error"} variant="outlined" />
          <MaturityChip score={roundedScore} />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
        <LinearProgress
          variant="determinate"
          value={roundedScore}
          sx={{
            flexGrow: 1,
            height: prominent ? 8 : 6,
            borderRadius: 999,
            bgcolor: neutralTokens.line200,
            "& .MuiLinearProgress-bar": { bgcolor: maturity.color },
          }}
        />
        <Typography variant="body2" fontWeight={800} sx={{ minWidth: 42, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {roundedScore}
        </Typography>
      </Stack>
    </Box>
  );
}

function toStatus(status: number): EntityStatus {
  if (status === AssessmentStatus.Draft) return "Draft";
  if (status === AssessmentStatus.InProgress) return "InProgress";
  if (status === AssessmentStatus.Submitted) return "Submitted";
  if (status === AssessmentStatus.Scored) return "Scored";
  return "Archived";
}

function resolveDate(assessment: AssessmentSummaryDto) {
  return assessment.scoredAtUtc ?? assessment.submittedAtUtc ?? assessment.startedAtUtc ?? assessment.createdAtUtc;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
