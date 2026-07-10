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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, MetricTile, PageHeader } from "shared/components";
import { useAssessments } from "shared/api/assessments";
import { AssessmentStatus, type AssessmentSummaryDto } from "shared/api/types";
import { RoutePaths } from "shared/constants/routePaths";
import { brandTokens, dataTokens, neutralTokens, semanticTokens } from "app/theme/tokens/palette";
import { MotionConfig } from "motion/react";
import { MotionReveal } from "features/dashboard/components/dashboardMotion";

type Filter = "all" | "notStarted" | "active" | "completed";

export function HistoryPage() {
  const navigate = useNavigate();
  const assessmentsQuery = useAssessments();
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () =>
      [...(assessmentsQuery.data ?? [])].sort(
        (a, b) => new Date(resolveDate(b)).getTime() - new Date(resolveDate(a)).getTime(),
      ),
    [assessmentsQuery.data],
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const notStarted = rows.filter((r) => r.status === AssessmentStatus.Draft).length;
    const inProgress = rows.filter((r) => r.status === AssessmentStatus.InProgress).length;
    const completed = rows.filter((r) => r.status >= AssessmentStatus.Submitted).length;
    return { total, notStarted, inProgress, completed };
  }, [rows]);

  const trend = useMemo(
    () =>
      [...rows]
        .filter((r) => r.status === AssessmentStatus.Scored && r.overallScore != null)
        .sort((a, b) => new Date(resolveDate(a)).getTime() - new Date(resolveDate(b)).getTime())
        .map((r) => ({ date: shortDate(resolveDate(r)), score: Math.round(r.overallScore ?? 0) })),
    [rows],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case "notStarted":
        return rows.filter((r) => r.status === AssessmentStatus.Draft);
      case "active":
        return rows.filter((r) => r.status === AssessmentStatus.InProgress);
      case "completed":
        return rows.filter((r) => r.status >= AssessmentStatus.Submitted);
      default:
        return rows;
    }
  }, [rows, filter]);

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        <PageHeader
          title="History"
          subtitle="Complete record of your assessment activity - not started, in progress and completed."
          actions={
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(RoutePaths.portalAssessments)}
            >
              My assessments
            </Button>
          }
        />

        {assessmentsQuery.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
        {assessmentsQuery.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Unable to load assessment history.
          </Alert>
        ) : null}

        {/* Metrics */}
        <MotionReveal
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          }}
        >
          <MetricTile label="Total" value={stats.total} icon={<AssignmentOutlinedIcon fontSize="inherit" />} accent={brandTokens.blue600} />
          <MetricTile label="Not started" value={stats.notStarted} icon={<MilitaryTechOutlinedIcon fontSize="inherit" />} accent={neutralTokens.ink500} />
          <MetricTile label="In progress" value={stats.inProgress} icon={<PendingActionsOutlinedIcon fontSize="inherit" />} accent={dataTokens.bandQA} />
          <MetricTile label="Completed" value={stats.completed} icon={<SendOutlinedIcon fontSize="inherit" />} accent={semanticTokens.successMain} />
        </MotionReveal>

        {/* Trend */}
        {trend.length >= 2 ? (
          <MotionReveal delay={0.08} sx={{ mt: 2 }}>
            <Card sx={{ p: 2.5 }}>
              <Typography variant="h3">Overall score trend</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Overall maturity score across scored assessments, oldest to most recent.
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="historyScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={brandTokens.blue600} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={brandTokens.blue600} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={neutralTokens.line200} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: neutralTokens.ink500, fontSize: 12 }} tickLine={false} axisLine={{ stroke: neutralTokens.line300 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: neutralTokens.ink400, fontSize: 11 }} tickLine={false} axisLine={false} width={34} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke={brandTokens.blue600} strokeWidth={2} fill="url(#historyScore)" dot={{ r: 2.5, fill: brandTokens.blue600 }} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </MotionReveal>
        ) : null}

        {/* Records */}
        <MotionReveal delay={0.12} sx={{ mt: 2 }}>
          <Card>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
              spacing={1.5}
              sx={{ px: 2.5, py: 2 }}
            >
              <Typography variant="h3">Activity log</Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={filter}
                onChange={(_, value: Filter | null) => value && setFilter(value)}
              >
                <ToggleButton value="all">All ({stats.total})</ToggleButton>
                <ToggleButton value="notStarted">Not started</ToggleButton>
                <ToggleButton value="active">In progress</ToggleButton>
                <ToggleButton value="completed">Completed</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <Divider />

            {filtered.length === 0 ? (
              <EmptyState
                title={rows.length === 0 ? "No history yet" : "No matching records"}
                description={
                  rows.length === 0
                    ? "Your assessment history appears after an assessment is assigned or completed."
                    : "No assessments match the selected filter."
                }
                action={
                  rows.length === 0 ? (
                    <Button
                      variant="outlined"
                      startIcon={<HistoryOutlinedIcon />}
                      onClick={() => navigate(RoutePaths.portalAssessments)}
                    >
                      Go to assessments
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 920 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Assessment</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Completion</TableCell>
                      <TableCell>Assessment started time</TableCell>
                      <TableCell>Completed time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((assessment) => (
                      <TableRow key={assessment.assessmentId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {assessment.title}
                          </Typography>
                          {assessment.description ? (
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", maxWidth: 320 }}>
                              {assessment.description}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <HistoryStatusChip assessment={assessment} />
                        </TableCell>
                        <TableCell sx={{ minWidth: 200 }}>
                          <Stack direction="row" alignItems="center" spacing={1.25}>
                            <LinearProgress
                              variant="determinate"
                              value={assessment.completionPercentage}
                              sx={{
                                flexGrow: 1,
                                height: 6,
                                borderRadius: 999,
                                bgcolor: neutralTokens.line200,
                                "& .MuiLinearProgress-bar": { bgcolor: brandTokens.blue600 },
                              }}
                            />
                            <Typography variant="caption" sx={{ minWidth: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                              {Math.round(assessment.completionPercentage)}%
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {assessment.answeredCount} / {assessment.questionCount} answered
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                          {formatStartedDate(assessment.startedAtUtc)}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                          {formatCompletedDate(resolveCompletedDate(assessment))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </MotionReveal>
      </Box>
    </MotionConfig>
  );
}

function HistoryStatusChip({ assessment }: { assessment: AssessmentSummaryDto }) {
  const status = toHistoryStatus(assessment);
  return (
    <Chip
      size="small"
      label={status.label}
      sx={{
        bgcolor: alpha(status.color, 0.12),
        color: status.color,
        fontWeight: 600,
        border: `1px solid ${alpha(status.color, 0.28)}`,
      }}
    />
  );
}

function toHistoryStatus(assessment: AssessmentSummaryDto) {
  if (assessment.status >= AssessmentStatus.Submitted) {
    return { label: "Completed", color: semanticTokens.successMain };
  }
  if (assessment.status === AssessmentStatus.InProgress) {
    return { label: "In progress", color: dataTokens.bandQA };
  }
  return { label: "Not started", color: neutralTokens.ink500 };
}

function resolveDate(assessment: AssessmentSummaryDto) {
  return assessment.scoredAtUtc ?? assessment.submittedAtUtc ?? assessment.startedAtUtc ?? assessment.createdAtUtc;
}

function resolveCompletedDate(assessment: AssessmentSummaryDto) {
  return assessment.submittedAtUtc ?? assessment.scoredAtUtc ?? null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatStartedDate(value?: string | null) {
  return value ? formatDate(value) : "Not started";
}

function formatCompletedDate(value?: string | null) {
  return value ? formatDate(value) : "Not completed";
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}