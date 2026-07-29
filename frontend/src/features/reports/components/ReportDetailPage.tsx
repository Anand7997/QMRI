import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Divider,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MotionConfig } from "motion/react";
import { EmptyState, PageHeader, StatusChip, type EntityStatus } from "shared/components";
import {
  AssessmentStatus,
  answerLabel,
  type AssessmentSummaryDto,
} from "shared/api/types";
import type { useAssessment } from "shared/api/assessments";
import { brandTokens, dataTokens, neutralTokens, semanticTokens } from "app/theme/tokens/palette";
import { MotionReveal } from "features/dashboard/components/dashboardMotion";
import { ExportCenter } from "features/dashboard/components/ExportCenter";
import {
  alignmentColors,
  alignmentData,
  answerDistribution,
  averageOverall,
  buildBenchmark,
  buildCategoryGroups,
  buildInsights,
  buildKpis,
  buildOpportunities,
  buildRecommendations,
  buildRiskAnalysis,
  formatDate,
  heatmapData,
  historyScores,
  previousScoreFor,
  priorityColor,
  priorityWindow,
  radarData,
  rankingData,
  resolveDate,
  riskColor,
  stageDistribution,
  stageForScore,
  statusBadgeFor,
  STAGES,
  trendData,
  type CategoryGroup,
  type Insight,
  type Kpi,
  type StageInfo,
} from "./reportAnalytics";
import { ChartCard, Heatmap, InterpretationNote, LegendRow, PlainTooltip, ScoreGauge, Sparkline } from "./ReportCharts";

const insightTone: Record<Insight["tone"], { color: string; surface: string }> = {
  positive: { color: semanticTokens.successMain, surface: semanticTokens.successSurface },
  warning: { color: semanticTokens.warningMain, surface: semanticTokens.warningSurface },
  critical: { color: semanticTokens.errorMain, surface: semanticTokens.errorSurface },
  info: { color: brandTokens.blue600, surface: brandTokens.blue50 },
};

type TabKey = "overview" | "strengths" | "actions" | "trends" | "details";
type FactTone = "default" | "success" | "error";

const REPORT_TABS: Array<{ key: TabKey; label: string; icon: React.ReactElement }> = [
  { key: "overview", label: "Overview", icon: <DashboardOutlinedIcon fontSize="small" /> },
  { key: "strengths", label: "Strengths & Gaps", icon: <InsightsOutlinedIcon fontSize="small" /> },
  { key: "actions", label: "Action Plan", icon: <FlagOutlinedIcon fontSize="small" /> },
  { key: "trends", label: "Trends & Risk", icon: <TrendingUpOutlinedIcon fontSize="small" /> },
  { key: "details", label: "Full Details", icon: <FormatListBulletedIcon fontSize="small" /> },
];

export function ReportDetailPage({
  assessment,
  detailQuery,
  history,
  focusSteps,
  actor,
  onBack,
}: {
  assessment: AssessmentSummaryDto;
  detailQuery: ReturnType<typeof useAssessment>;
  history: AssessmentSummaryDto[];
  focusSteps: boolean;
  actor?: string;
  onBack: () => void;
}) {
  const detail = detailQuery.data;
  const summary = detail?.summary ?? assessment;
  const questionResults = useMemo(() => detail?.questionResults ?? [], [detail?.questionResults]);
  const categoryGroups = useMemo(
    () => buildCategoryGroups(questionResults, detail?.scores ?? []),
    [questionResults, detail?.scores],
  );

  const overallScore = Math.round(summary.overallScore ?? 0);
  const overallStage = stageForScore(overallScore);
  const badge = statusBadgeFor(overallScore);

  const previousScore = useMemo(() => previousScoreFor(history, summary), [history, summary]);
  const overallDelta = previousScore == null ? null : overallScore - previousScore;
  const yourAverage = useMemo(() => averageOverall(history), [history]);
  const spark = useMemo(() => historyScores(history, summary), [history, summary]);

  const kpis = useMemo(
    () => buildKpis(overallScore, summary.completionPercentage ?? 0, categoryGroups, previousScore, spark),
    [overallScore, summary.completionPercentage, categoryGroups, previousScore, spark],
  );
  const radar = useMemo(() => radarData(categoryGroups), [categoryGroups]);
  const ranking = useMemo(() => rankingData(categoryGroups), [categoryGroups]);
  const alignment = useMemo(() => alignmentData(categoryGroups), [categoryGroups]);
  const heat = useMemo(() => heatmapData(categoryGroups), [categoryGroups]);
  const stageDist = useMemo(() => stageDistribution(categoryGroups), [categoryGroups]);
  const answerDist = useMemo(() => answerDistribution(questionResults), [questionResults]);
  const insights = useMemo(() => buildInsights(categoryGroups, overallDelta), [categoryGroups, overallDelta]);
  const recommendations = useMemo(
    () => buildRecommendations(detail?.recommendations ?? [], categoryGroups),
    [detail?.recommendations, categoryGroups],
  );
  const opportunities = useMemo(() => buildOpportunities(categoryGroups), [categoryGroups]);
  const risk = useMemo(() => buildRiskAnalysis(categoryGroups, overallDelta), [categoryGroups, overallDelta]);
  const benchmark = useMemo(() => buildBenchmark(overallScore, yourAverage, previousScore), [overallScore, yourAverage, previousScore]);
  const trend = useMemo(() => trendData(history, summary), [history, summary]);

  const [tab, setTab] = useState<TabKey>("overview");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [shared, setShared] = useState(false);
  const [expandedDetailIds, setExpandedDetailIds] = useState<string[]>([]);
  const detailedStepsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setExpandedDetailIds([]);
    void detailQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment.assessmentId]);

  useEffect(() => {
    if (!focusSteps || categoryGroups.length === 0) return;
    setTab("details");
  }, [assessment.assessmentId, categoryGroups.length, focusSteps]);

  useEffect(() => {
    if (!focusSteps || detailQuery.isLoading || detailQuery.isFetching) return;
    const handle = window.setTimeout(() => detailedStepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => window.clearTimeout(handle);
  }, [categoryGroups.length, detailQuery.isFetching, detailQuery.isLoading, focusSteps]);

  function drillToCategory(categoryId: string) {
    setTab("details");
    setSelectedCategoryId(categoryId);
    window.setTimeout(() => detailedStepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }

  function detailNodeOpen(nodeId: string) {
    return expandedDetailIds.includes(nodeId);
  }

  function toggleDetailNode(nodeId: string) {
    setExpandedDetailIds((current) => (
      current.includes(nodeId) ? current.filter((id) => id !== nodeId) : [...current, nodeId]
    ));
  }

  async function shareReport() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
    } catch {
      setShared(true);
    }
  }

  const highestName = kpis.find((k) => k.key === "best")?.sub ?? "";
  const lowestName = kpis.find((k) => k.key === "worst")?.sub ?? "";
  const readinessValue = kpis.find((k) => k.key === "readiness")?.value ?? "--";
  const managedCount = categoryGroups.filter((group) => group.stage.level >= 4).length;
  const reportId = summary.assessmentId.slice(0, 8).toUpperCase();
  const dateTaken = formatDate(resolveDate(summary));
  const departmentLabel = summary.departments.length > 0 ? summary.departments.join(", ") : "No department tagged";

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        <PageHeader
          title="Detailed report"
          subtitle="A visual, plain-language read-out of your quality-maturity assessment - with the actions to take next."
          actions={
            <Stack direction="row" spacing={1}>
              <Button variant="text" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>Print / PDF</Button>
              <Button variant="text" startIcon={<ShareOutlinedIcon />} onClick={shareReport}>Share</Button>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>Back to reports</Button>
            </Stack>
          }
        />

        {detailQuery.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
        {detailQuery.isError ? <Alert severity="error" sx={{ mb: 2 }}>Unable to load detailed score data.</Alert> : null}

        <Stack spacing={2.5}>
          {/* ---------------------------------------------------------- Hero */}
          <MotionReveal>
            <Card
              sx={{
                overflow: "hidden",
                border: `1px solid ${alpha(brandTokens.blue600, 0.16)}`,
                boxShadow: `0 18px 54px ${alpha(brandTokens.blue600, 0.14)}`,
                bgcolor: "background.paper",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  p: { xs: 2.5, md: 3.5 },
                  borderBottom: 1,
                  borderColor: alpha(brandTokens.blue600, 0.12),
                  bgcolor: brandTokens.blue50,
                  backgroundImage: `linear-gradient(135deg, ${brandTokens.blue50} 0%, #ffffff 48%, ${alpha(overallStage.color, 0.1)} 100%)`,
                }}
              >
                <Stack direction={{ xs: "column", lg: "row" }} spacing={3} justifyContent="space-between" alignItems={{ lg: "center" }}>
                  <Box sx={{ minWidth: 0, maxWidth: 760 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.25 }}>
                      <Chip size="small" label="Quality Maturity Assessment" sx={{ bgcolor: "background.paper", color: brandTokens.blue700, fontWeight: 800, border: `1px solid ${alpha(brandTokens.blue600, 0.2)}` }} />
                      <Chip
                        size="small"
                        label={badge.label}
                        sx={{ bgcolor: alpha(badge.color, 0.12), color: badge.color, fontWeight: 800, border: `1px solid ${alpha(badge.color, 0.3)}` }}
                      />
                      <StatusChip status={toStatus(summary.status)} />
                    </Stack>
                    <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 34 }, lineHeight: 1.08 }}>{summary.title}</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 680, lineHeight: 1.6 }}>{badge.meaning}</Typography>
                    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, mt: 2 }}>
                      <ReportFact label="Report ID" value={reportId} />
                      <ReportFact label="Date taken" value={dateTaken} />
                      <ReportFact label="Scope" value={departmentLabel} />
                      <ReportFact label="Evidence" value={`${summary.answeredCount}/${summary.questionCount} responses`} />
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      width: { xs: "100%", lg: 292 },
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha("#ffffff", 0.86),
                      border: `1px solid ${alpha(overallStage.color, 0.24)}`,
                      boxShadow: `0 16px 40px ${alpha(overallStage.color, 0.16)}`,
                      flexShrink: 0,
                    }}
                  >
                    <ScoreGauge score={overallScore} color={overallStage.color} size={210} />
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: overallStage.color }} />
                      <Typography variant="body2" fontWeight={900} sx={{ color: overallStage.color }}>
                        {overallStage.level}/5 - {overallStage.label}
                      </Typography>
                    </Stack>
                    {overallDelta != null ? (
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ mt: 0.5, color: overallDelta >= 0 ? semanticTokens.successMain : semanticTokens.errorMain }}>
                        {overallDelta >= 0 ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />}
                        <Typography variant="caption" fontWeight={800}>{Math.abs(overallDelta)} pts vs previous</Typography>
                      </Stack>
                    ) : null}
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ p: { xs: 2, md: 2.5 }, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))", xl: "1fr 1fr 1.2fr" } }}>
                <HeroStat icon={<ShieldOutlinedIcon />} label="Managed+ areas" value={`${managedCount}/${categoryGroups.length || 0}`} tone={semanticTokens.successMain} />
                <HeroStat icon={<FlagOutlinedIcon />} label="Priority area" value={lowestName || "No data"} tone={semanticTokens.warningMain} />
                <MaturityJourney currentLevel={overallStage.level} />
              </Box>
            </Card>
          </MotionReveal>

          {/* ---------------------------------------------------------- Tabbed sections */}
          {categoryGroups.length > 0 ? (
            <>
              <ReportTabs value={tab} onChange={setTab} />

              {/* ============================== OVERVIEW ============================== */}
              {tab === "overview" ? (
                <MotionReveal delay={0.04} key="overview">
                  <Stack spacing={2.5}>
                    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" } }}>
                      {kpis.map((kpi) => <KpiCard key={kpi.key} kpi={kpi} />)}
                      <SummaryReadCard highest={highestName} lowest={lowestName} readiness={readinessValue} />
                    </Box>
                    <OverviewSpotlight
                      groups={categoryGroups}
                      recommendations={recommendations}
                      onSeeActions={() => setTab("actions")}
                      onSeeStrengths={() => setTab("strengths")}
                      onDrill={drillToCategory}
                    />
                  </Stack>
                </MotionReveal>
              ) : null}

              {/* ============================== STRENGTHS & GAPS ============================== */}
              {tab === "strengths" ? (
              <Stack spacing={2.5} key="strengths">
              <SectionTitle icon={<InsightsOutlinedIcon />} title="Performance overview" subtitle="How each competency scores, ranked and mapped. Click any competency to jump to its detailed breakdown." />
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
                <MotionReveal delay={0.05}>
                  <ChartCard
                    title="Competency strengths"
                    subtitle="Maturity score across all competencies"
                    interpretation={strengthInterpretation(categoryGroups)}
                  >
                    <ResponsiveContainer width="100%" height={320}>
                      <RadarChart data={radar} outerRadius="70%">
                        <PolarGrid stroke={neutralTokens.line200} />
                        <PolarAngleAxis dataKey="category" tick={{ fill: neutralTokens.ink500, fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="score" stroke={brandTokens.blue600} fill={brandTokens.blue600} fillOpacity={0.22} isAnimationActive />
                        <Tooltip content={<PlainTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </MotionReveal>

                <MotionReveal delay={0.1}>
                  <ChartCard
                    title="Competency ranking"
                    subtitle="Highest to lowest - colour shows maturity band"
                    interpretation={rankingInterpretation(categoryGroups)}
                  >
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={ranking} layout="vertical" margin={{ left: 8, right: 28, top: 4, bottom: 4 }}>
                        <CartesianGrid horizontal={false} stroke={neutralTokens.line200} strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: neutralTokens.ink500, fontSize: 12 }} />
                        <YAxis type="category" dataKey="category" width={140} tick={{ fill: neutralTokens.ink700, fontSize: 11 }} />
                        <Tooltip content={<PlainTooltip />} cursor={{ fill: alpha(brandTokens.blue600, 0.06) }} />
                        <Bar
                          dataKey="score"
                          radius={[0, 6, 6, 0]}
                          barSize={18}
                          isAnimationActive
                          onClick={(data: unknown) => {
                            const id = (data as { categoryId?: string })?.categoryId;
                            if (id) drillToCategory(id);
                          }}
                        >
                          {ranking.map((entry) => <Cell key={entry.categoryId} fill={entry.color} cursor="pointer" />)}
                          <LabelList dataKey="score" position="right" style={{ fontSize: 11, fontWeight: 700, fill: neutralTokens.ink700 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </MotionReveal>

                <MotionReveal delay={0.12}>
                  <ChartCard
                    title="Competency heatmap"
                    subtitle="Every module, coloured by maturity. Click a row to drill in."
                    interpretation="Red and amber cells are the modules dragging a competency down - the fastest place to recover points."
                  >
                    <Heatmap rows={heat} onSelect={drillToCategory} selectedId={selectedCategoryId} />
                    <LegendRow items={[
                      { label: "Immature", color: semanticTokens.errorMain },
                      { label: "Developing", color: semanticTokens.warningMain },
                      { label: "Defined", color: brandTokens.blue600 },
                      { label: "Managed", color: dataTokens.bandIQ },
                      { label: "Optimized", color: semanticTokens.successMain },
                    ]} />
                  </ChartCard>
                </MotionReveal>

                <MotionReveal delay={0.14}>
                  <ChartCard
                    title="Answer alignment by competency"
                    subtitle="How responses compare with expected best-practice answers"
                    interpretation="Tall red/amber segments mean many answers fall short of the expected standard - target those competencies for training first."
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={alignment} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                        <CartesianGrid vertical={false} stroke={neutralTokens.line200} strokeDasharray="3 3" />
                        <XAxis dataKey="category" tick={{ fill: neutralTokens.ink500, fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                        <YAxis allowDecimals={false} tick={{ fill: neutralTokens.ink500, fontSize: 12 }} />
                        <Tooltip content={<PlainTooltip unit="" />} cursor={{ fill: alpha(brandTokens.blue600, 0.06) }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {Object.keys(alignmentColors).map((key) => (
                          <Bar key={key} dataKey={key} stackId="a" fill={alignmentColors[key]} radius={key === "Not answered" ? [4, 4, 0, 0] : undefined} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </MotionReveal>
              </Box>

              {/* -------------------------------------------------------- Distribution */}
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
                <MotionReveal delay={0.05}>
                  <ChartCard title="Maturity distribution" subtitle="Share of competencies at each maturity stage" interpretation={distributionInterpretation(categoryGroups)}>
                    <DonutChart data={stageDist} />
                  </ChartCard>
                </MotionReveal>
                <MotionReveal delay={0.08}>
                  <ChartCard title="Response distribution" subtitle="How every answer was rated against the expected answer" interpretation='A high share of "Yes" means practices are broadly in place; large "No / Partial" shares point to concrete gaps to close.'>
                    <DonutChart data={answerDist} unit="" />
                  </ChartCard>
                </MotionReveal>
              </Box>

              {/* -------------------------------------------------------- Breakdown table */}
              <MotionReveal delay={0.05}>
                <Card sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h3">Competency breakdown</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Search, scan strengths and weaknesses, and click a row to drill in.</Typography>
                    </Box>
                    <TextField
                      size="small"
                      placeholder="Search competency..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                      sx={{ minWidth: 240 }}
                    />
                  </Stack>
                  <BreakdownTable groups={categoryGroups} search={search} onSelect={drillToCategory} />
                </Card>
              </MotionReveal>

              </Stack>
              ) : null}

              {/* ============================== ACTION PLAN ============================== */}
              {tab === "actions" ? (
              <Stack spacing={2.5} key="actions">
              {insights.length === 0 && recommendations.length === 0 && opportunities.length === 0 ? (
                <Card sx={{ p: 4 }}>
                  <EmptyState title="No actions generated" description="No insights, recommendations, or improvement opportunities were produced for this assessment." />
                </Card>
              ) : null}
              {/* -------------------------------------------------------- Insights */}
              {insights.length > 0 ? (
                <>
                  <SectionTitle icon={<AutoAwesomeOutlinedIcon />} title="Generated insights" subtitle="Automatic observations derived from your results." />
                  <MotionReveal delay={0.05}>
                    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" } }}>
                      {insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
                    </Box>
                  </MotionReveal>
                </>
              ) : null}

              {/* -------------------------------------------------------- Recommendations */}
              {recommendations.length > 0 ? (
                <>
                  <SectionTitle icon={<FlagOutlinedIcon />} title="Prioritised recommendations" subtitle="What to act on, in what order, and the payoff." />
                  <MotionReveal delay={0.05}>
                    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" } }}>
                      {recommendations.map((rec) => (
                        <Card key={rec.id} sx={{ p: 2.5, borderLeft: `4px solid ${priorityColor[rec.priority]}` }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                            <Typography variant="subtitle1" fontWeight={800}>{rec.title}</Typography>
                            <Chip size="small" label={rec.priority} sx={{ bgcolor: alpha(priorityColor[rec.priority], 0.14), color: priorityColor[rec.priority], fontWeight: 800 }} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">{rec.category} - {priorityWindow[rec.priority]}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{rec.description}</Typography>
                          <Divider sx={{ my: 1.5 }} />
                          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, 1fr)" }}>
                            <MiniFact label="Impact" value={rec.impact} />
                            <MiniFact label="Effort" value={rec.effort} />
                            <MiniFact label="Expected improvement" value={rec.expectedImprovement} />
                            <MiniFact label="Suggested training" value={rec.suggestedTraining} />
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  </MotionReveal>
                </>
              ) : null}

              {/* -------------------------------------------------------- Improvement opportunities */}
              {opportunities.length > 0 ? (
                <>
                  <SectionTitle icon={<TrendingUpOutlinedIcon />} title="Improvement opportunities" subtitle="Where a focused push closes the biggest gaps." />
                  <MotionReveal delay={0.05}>
                    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" } }}>
                      {opportunities.map((opp) => (
                        <Card key={opp.categoryId} sx={{ p: 2.5, cursor: "pointer" }} onClick={() => drillToCategory(opp.categoryId)}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography variant="subtitle2" fontWeight={800} noWrap title={opp.categoryName}>{opp.categoryName}</Typography>
                            <Chip size="small" label={opp.stage.label} sx={{ bgcolor: alpha(opp.stage.color, 0.12), color: opp.stage.color, fontWeight: 700 }} />
                          </Stack>
                          <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                            <FigureBlock label="Current" value={`${opp.current}`} color={opp.stage.color} />
                            <FigureBlock label="Target" value={`${opp.target}`} color={semanticTokens.successMain} />
                            <FigureBlock label="Gap" value={`+${opp.gap}`} color={brandTokens.blue600} />
                          </Stack>
                          <Box sx={{ mt: 1.5, height: 8, borderRadius: 999, bgcolor: neutralTokens.line200, overflow: "hidden" }}>
                            <Box sx={{ width: `${opp.current}%`, height: "100%", bgcolor: opp.stage.color, borderRadius: 999 }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: "block" }}>{opp.suggestedActions}</Typography>
                        </Card>
                      ))}
                    </Box>
                  </MotionReveal>
                </>
              ) : null}

              </Stack>
              ) : null}

              {/* ============================== TRENDS & RISK ============================== */}
              {tab === "trends" ? (
              <Stack spacing={2.5} key="trends">
              {/* -------------------------------------------------------- Trend + Benchmark */}
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1.3fr 1fr" } }}>
                <MotionReveal delay={0.05}>
                  <ChartCard
                    title="Trend over time"
                    subtitle="Score and completion across your past assessments of this type"
                    interpretation={trend.length >= 2 ? trendInterpretation(trend) : undefined}
                  >
                    {trend.length >= 2 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutralTokens.line200} />
                          <XAxis dataKey="label" tick={{ fill: neutralTokens.ink500, fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: neutralTokens.ink500, fontSize: 12 }} />
                          <Tooltip content={<PlainTooltip unit="" />} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Line type="monotone" dataKey="score" name="Maturity score" stroke={brandTokens.blue600} strokeWidth={3} dot={{ r: 3 }} isAnimationActive />
                          <Line type="monotone" dataKey="completion" name="Completion %" stroke={semanticTokens.successMain} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} isAnimationActive />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState title="Trend appears over time" description="Complete another assessment of this type to unlock the score-over-time trend." />
                    )}
                  </ChartCard>
                </MotionReveal>

                <MotionReveal delay={0.08}>
                  <ChartCard
                    title="Benchmark comparison"
                    subtitle="This assessment vs your history and the Optimized target"
                    interpretation={benchmarkInterpretation(overallScore, yourAverage, previousScore)}
                  >
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={benchmark} layout="vertical" margin={{ left: 12, right: 28, top: 4, bottom: 4 }}>
                        <CartesianGrid horizontal={false} stroke={neutralTokens.line200} strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: neutralTokens.ink500, fontSize: 12 }} />
                        <YAxis type="category" dataKey="label" width={130} tick={{ fill: neutralTokens.ink700, fontSize: 11 }} />
                        <Tooltip content={<PlainTooltip />} cursor={{ fill: alpha(brandTokens.blue600, 0.06) }} />
                        <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20} isAnimationActive>
                          {benchmark.map((entry) => <Cell key={entry.label} fill={entry.color} />)}
                          <LabelList dataKey="score" position="right" style={{ fontSize: 11, fontWeight: 700, fill: neutralTokens.ink700 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </MotionReveal>
              </Box>

              {/* -------------------------------------------------------- Risk analysis */}
              <SectionTitle icon={<ShieldOutlinedIcon />} title="Risk analysis" subtitle="Where quality risk concentrates today." />
              <MotionReveal delay={0.05}>
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
                  <Card sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>Competencies at risk</Typography>
                    <Stack spacing={1}>
                      {risk.areas.map((area) => (
                        <Stack key={area.id} direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${alpha(riskColor[area.level], 0.25)}`, bgcolor: alpha(riskColor[area.level], 0.05) }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: riskColor[area.level], flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={700} sx={{ flexGrow: 1, minWidth: 0 }} noWrap>{area.name}</Typography>
                          <Typography variant="body2" fontWeight={800} sx={{ color: riskColor[area.level], fontVariantNumeric: "tabular-nums" }}>{area.score}</Typography>
                          <Chip size="small" label={`${area.level} risk`} sx={{ bgcolor: alpha(riskColor[area.level], 0.12), color: riskColor[area.level], fontWeight: 700 }} />
                        </Stack>
                      ))}
                    </Stack>
                  </Card>
                  <Card sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>Modules needing attention</Typography>
                    {risk.performanceDecline ? (
                      <Alert severity="warning" sx={{ mb: 1.5 }}>Overall score fell {risk.declineAmount} points versus your previous assessment - review what changed.</Alert>
                    ) : null}
                    {risk.modules.length === 0 ? (
                      <EmptyState title="No high-risk modules" description="No module is at Immature or Developing maturity. Keep it up." />
                    ) : (
                      <Stack spacing={1}>
                        {risk.modules.map((module) => (
                          <Stack key={module.id} direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${neutralTokens.line200}` }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: riskColor[module.level], flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0 }} noWrap>{module.name}</Typography>
                            <Typography variant="body2" fontWeight={800} sx={{ color: riskColor[module.level], fontVariantNumeric: "tabular-nums" }}>{module.score}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                    <InterpretationNote>High-risk areas are those at Immature or Developing maturity. Direct the next review and training budget here first.</InterpretationNote>
                  </Card>
                </Box>
              </MotionReveal>
              </Stack>
              ) : null}

              {/* ============================== FULL DETAILS ============================== */}
              {tab === "details" ? (
              <Stack spacing={2.5} key="details">
                <MotionReveal delay={0.04}>
                  <Card ref={detailedStepsRef} sx={{ p: { xs: 1.5, md: 2 } }}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.25} alignItems={{ sm: "center" }}>
                      <Box>
                        <Typography variant="h3" sx={{ fontSize: { xs: 18, md: 20 } }}>Detailed step-by-step result</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35 }}>All competencies are merged by default. Click the Expand label or arrow on any row to see the question and answer grid.</Typography>
                      </Box>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        <Chip size="small" label={`${categoryGroups.length} competencies`} sx={{ height: 22, bgcolor: brandTokens.blue50, color: brandTokens.blue700, fontSize: 11, fontWeight: 800 }} />
                        <Chip size="small" variant="outlined" label={`${questionResults.length} questions`} sx={{ height: 22, fontSize: 11, fontWeight: 800 }} />
                        <Chip size="small" label="Click rows to expand" sx={{ height: 22, bgcolor: alpha(brandTokens.blue600, 0.08), color: brandTokens.blue700, fontSize: 11, fontWeight: 800 }} />
                      </Stack>
                    </Stack>
                    <Box sx={{ mt: 1.5, border: `1px solid ${neutralTokens.line200}`, borderRadius: 1.5, overflow: "hidden", bgcolor: "background.paper" }}>
                      {categoryGroups.map((group, groupIndex) => {
                        const categoryNodeId = `category:${group.categoryId}`;
                        const categoryOpen = detailNodeOpen(categoryNodeId);
                        return (
                          <Box key={group.categoryId} sx={{ borderTop: groupIndex === 0 ? 0 : `1px solid ${neutralTokens.line200}` }}>
                            <DetailTreeRow
                              open={categoryOpen}
                              depth={0}
                              title={group.categoryName}
                              meta={`${group.questionCount} questions`}
                              tone={selectedCategoryId === group.categoryId ? brandTokens.blue600 : group.stage.color}
                              onToggle={() => toggleDetailNode(categoryNodeId)}
                            />
                            <Collapse in={categoryOpen} timeout={220} unmountOnExit>
                              <Box sx={{ display: "grid", gap: 0.6, px: { xs: 0.75, md: 1 }, pb: 0.9 }}>
                                {group.modules.map((module) => {
                                  const moduleNodeId = `module:${module.key}`;
                                  const moduleOpen = detailNodeOpen(moduleNodeId);
                                  return (
                                    <Box key={module.key} sx={{ border: `1px solid ${neutralTokens.line200}`, borderRadius: 1.25, overflow: "hidden", bgcolor: neutralTokens.surface1 }}>
                                      <DetailTreeRow
                                        open={moduleOpen}
                                        depth={1}
                                        title={module.moduleName}
                                        meta={`${module.questionCount} questions`}
                                        tone={module.stage.color}
                                        onToggle={() => toggleDetailNode(moduleNodeId)}
                                      />
                                      <Collapse in={moduleOpen} timeout={220} unmountOnExit>
                                        <Box sx={{ display: "grid", gap: 0.6, px: { xs: 0.65, md: 0.9 }, pb: 0.8 }}>
                                          {module.subModules.map((subModule) => {
                                            const subModuleNodeId = `sub-module:${subModule.key}`;
                                            const subModuleOpen = detailNodeOpen(subModuleNodeId);
                                            return (
                                              <Box key={subModule.key} sx={{ border: `1px solid ${neutralTokens.line200}`, borderRadius: 1.15, overflow: "hidden", bgcolor: "background.paper" }}>
                                                <DetailTreeRow
                                                  open={subModuleOpen}
                                                  depth={2}
                                                  title={subModule.subModuleName}
                                                  meta={`${subModule.questionCount} questions`}
                                                  tone={brandTokens.blue600}
                                                  onToggle={() => toggleDetailNode(subModuleNodeId)}
                                                />
                                                <Collapse in={subModuleOpen} timeout={220} unmountOnExit>
                                                  <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "minmax(0, 1fr) 132px 132px", gap: 0.75, px: 0.85, py: 0.55, bgcolor: neutralTokens.surface2, borderTop: `1px solid ${neutralTokens.line200}`, borderBottom: `1px solid ${neutralTokens.line200}` }}>
                                                    <Typography variant="caption" fontWeight={900} sx={{ fontSize: 10.5, color: neutralTokens.ink500 }}>Question</Typography>
                                                    <Typography variant="caption" fontWeight={900} sx={{ fontSize: 10.5, color: neutralTokens.ink500 }}>Your answer</Typography>
                                                    <Typography variant="caption" fontWeight={900} sx={{ fontSize: 10.5, color: neutralTokens.ink500 }}>Expected answer</Typography>
                                                  </Box>
                                                  {subModule.questions.map((question, index) => {
                                                    const answerTone: FactTone = question.answer == null ? "default" : question.answer === question.expectedAnswer ? "success" : "error";
                                                    return (
                                                      <Box key={question.questionId} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 132px 132px" }, gap: 0.75, alignItems: "stretch", px: 0.85, py: 0.75, borderTop: index === 0 ? 0 : `1px solid ${neutralTokens.line200}` }}>
                                                        <Box sx={{ minWidth: 0 }}>
                                                          <Typography variant="caption" fontWeight={900} sx={{ display: "block", color: brandTokens.blue700, fontSize: 10.5, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>Q{index + 1}</Typography>
                                                          <Typography variant="body2" fontWeight={650} sx={{ mt: 0.35, fontSize: 12, lineHeight: 1.35, color: neutralTokens.ink900, wordBreak: "break-word" }}>{question.questionText}</Typography>
                                                        </Box>
                                                        <FactBox
                                                          label="Your answer"
                                                          value={question.answer == null ? "Not answered" : answerLabel[question.answer]}
                                                          tone={answerTone}
                                                        />
                                                        <FactBox label="Expected answer" value={answerLabel[question.expectedAnswer]} tone="success" emphasize />
                                                      </Box>
                                                    );
                                                  })}
                                                </Collapse>
                                              </Box>
                                            );
                                          })}
                                        </Box>
                                      </Collapse>
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      })}
                    </Box>
                  </Card>
                </MotionReveal>
              </Stack>
              ) : null}
            </>
          ) : detailQuery.isLoading || detailQuery.isFetching ? (
            <LinearProgress sx={{ borderRadius: 999 }} />
          ) : (
            <Card sx={{ p: 4 }}>
              <EmptyState title="No detailed result" description="Detailed question-level results were not returned for this assessment." />
            </Card>
          )}

          {/* ---------------------------------------------------------- Export & filter */}
          <MotionReveal delay={0.05}>
            <ExportCenter
              title="Export & share this report"
              scope="User"
              assessments={[summary]}
              details={detail ? [detail] : []}
              actor={actor ?? "User"}
            />
          </MotionReveal>

          {/* ---------------------------------------------------------- Help */}
          <MotionReveal delay={0.05}>
            <Card sx={{ p: 2.5, borderStyle: "dashed" }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between">
                <Box>
                  <Typography variant="h3">Need help?</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    For support in understanding the report or planning the next improvement steps, contact BighneswarP@quinnox.com.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: brandTokens.blue600 }}>
                  <MailOutlineIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={700}>BighneswarP@quinnox.com</Typography>
                </Stack>
              </Stack>
            </Card>
          </MotionReveal>
        </Stack>

        <Snackbar open={shared} autoHideDuration={3000} onClose={() => setShared(false)} message="Report link copied to clipboard" />
      </Box>
    </MotionConfig>
  );
}

/* ------------------------------------------------------------------ *
 * Small presentational pieces
 * ------------------------------------------------------------------ */
function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 1.5, mb: 0.25 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(brandTokens.blue600, 0.1), color: brandTokens.blue600, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h2" sx={{ fontSize: { xs: 20, md: 22 }, lineHeight: 1.15 }}>{title}</Typography>
        {subtitle ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography> : null}
      </Box>
    </Stack>
  );
}

function ReportTabs({ value, onChange }: { value: TabKey; onChange: (key: TabKey) => void }) {
  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        mx: { xs: -0.5, md: 0 },
        px: { xs: 0.5, md: 1 },
        bgcolor: alpha("#ffffff", 0.85),
        backdropFilter: "blur(8px)",
        borderRadius: 2,
        border: `1px solid ${neutralTokens.line200}`,
        boxShadow: `0 6px 20px ${alpha(brandTokens.blue600, 0.06)}`,
      }}
    >
      <Tabs
        value={value}
        onChange={(_event, next: TabKey) => onChange(next)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 52,
          "& .MuiTab-root": { minHeight: 52, textTransform: "none", fontWeight: 700, fontSize: 14, gap: 0.75 },
          "& .MuiTab-iconWrapper": { mb: "0 !important", mr: 0.75 },
          "& .MuiTabs-indicator": { height: 3, borderRadius: 999, bgcolor: brandTokens.blue600 },
        }}
      >
        {REPORT_TABS.map((item) => (
          <Tab key={item.key} value={item.key} icon={item.icon} iconPosition="start" label={item.label} />
        ))}
      </Tabs>
    </Box>
  );
}

function OverviewSpotlight({
  groups,
  recommendations,
  onSeeActions,
  onSeeStrengths,
  onDrill,
}: {
  groups: CategoryGroup[];
  recommendations: ReturnType<typeof buildRecommendations>;
  onSeeActions: () => void;
  onSeeStrengths: () => void;
  onDrill: (categoryId: string) => void;
}) {
  const sorted = groups.slice().sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const focus = sorted.slice(-3).reverse().filter((g) => g.categoryId !== strongest?.categoryId);
  const topRecs = recommendations.slice(0, 3);

  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
      {/* Where you stand */}
      <Card sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Typography variant="h3" sx={{ fontSize: 18 }}>Where you stand</Typography>
          <Button variant="text" size="small" onClick={onSeeStrengths}>See all competencies</Button>
        </Stack>
        {strongest ? (
          <SpotlightRow
            tone={semanticTokens.successMain}
            heading="Strongest competency"
            name={strongest.categoryName}
            score={strongest.score}
            stageLabel={strongest.stage.label}
            onClick={() => onDrill(strongest.categoryId)}
          />
        ) : null}
        <Stack spacing={1} sx={{ mt: 1.25 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.06em" }}>Needs the most focus</Typography>
          {focus.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No weak competencies — every area is holding up well.</Typography>
          ) : (
            focus.map((group) => (
              <SpotlightRow
                key={group.categoryId}
                tone={group.stage.color}
                name={group.categoryName}
                score={group.score}
                stageLabel={group.stage.label}
                onClick={() => onDrill(group.categoryId)}
                compact
              />
            ))
          )}
        </Stack>
      </Card>

      {/* Do this next */}
      <Card sx={{ p: { xs: 2, md: 2.5 }, bgcolor: brandTokens.blue50, border: `1px solid ${alpha(brandTokens.blue600, 0.16)}` }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Typography variant="h3" sx={{ fontSize: 18 }}>Do this next</Typography>
          {recommendations.length > topRecs.length ? (
            <Button variant="text" size="small" onClick={onSeeActions}>{`View all ${recommendations.length}`}</Button>
          ) : null}
        </Stack>
        {topRecs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No priority actions right now. Keep reinforcing your current practices.</Typography>
        ) : (
          <Stack spacing={1.25}>
            {topRecs.map((rec, index) => (
              <Stack
                key={rec.id}
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
                sx={{ p: 1.5, borderRadius: 2, bgcolor: "background.paper", border: `1px solid ${alpha(priorityColor[rec.priority], 0.28)}` }}
              >
                <Box sx={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha(priorityColor[rec.priority], 0.14), color: priorityColor[rec.priority], fontWeight: 900, fontSize: 13 }}>{index + 1}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" fontWeight={800}>{rec.title}</Typography>
                    <Chip size="small" label={rec.priority} sx={{ height: 20, bgcolor: alpha(priorityColor[rec.priority], 0.14), color: priorityColor[rec.priority], fontWeight: 800 }} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35 }}>
                    {rec.category} · Expected improvement {rec.expectedImprovement}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>
    </Box>
  );
}

function SpotlightRow({
  tone,
  heading,
  name,
  score,
  stageLabel,
  onClick,
  compact = false,
}: {
  tone: string;
  heading?: string;
  name: string;
  score: number;
  stageLabel: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <Box>
      {heading ? <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.06em" }}>{heading}</Typography> : null}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onClick(); } }}
        sx={{
          cursor: "pointer",
          p: compact ? 1 : 1.25,
          mt: heading ? 0.5 : 0,
          borderRadius: 2,
          border: `1px solid ${alpha(tone, 0.25)}`,
          bgcolor: alpha(tone, 0.05),
          transition: "background-color 160ms ease",
          "&:hover": { bgcolor: alpha(tone, 0.1) },
        }}
      >
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: tone, flexShrink: 0 }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={800} noWrap title={name}>{name}</Typography>
          <Typography variant="caption" color="text.secondary">{stageLabel}</Typography>
        </Box>
        <Typography variant="body2" fontWeight={900} sx={{ color: tone, fontVariantNumeric: "tabular-nums" }}>{score}</Typography>
      </Stack>
    </Box>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const up = (kpi.delta ?? 0) >= 0;
  return (
    <Card
      sx={{
        p: 0,
        height: "100%",
        overflow: "hidden",
        border: `1px solid ${alpha(kpi.accent, 0.2)}`,
        boxShadow: `0 10px 28px ${alpha(kpi.accent, 0.09)}`,
      }}
    >
      <Box sx={{ height: 4, bgcolor: kpi.accent }} />
      <Box sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" spacing={1.5} alignItems="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.06em" }}>{kpi.label}</Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1.05, fontVariantNumeric: "tabular-nums", mt: 0.25 }}>{kpi.value}</Typography>
          </Box>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(kpi.accent, 0.12), border: `1px solid ${alpha(kpi.accent, 0.24)}` }} />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.1, minHeight: 24 }}>
          {kpi.delta !== undefined ? (
            <Stack direction="row" spacing={0.25} alignItems="center" sx={{ color: up ? semanticTokens.successMain : semanticTokens.errorMain, fontWeight: 800, fontSize: 12 }}>
              {up ? <ArrowUpwardIcon sx={{ fontSize: 13 }} /> : <ArrowDownwardIcon sx={{ fontSize: 13 }} />}
              {Math.abs(kpi.delta)}{kpi.deltaSuffix}
            </Stack>
          ) : null}
          <Typography variant="caption" color="text.secondary" noWrap>{kpi.sub}</Typography>
        </Stack>
        {kpi.sparkline && kpi.sparkline.length >= 2 ? (
          <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${neutralTokens.line200}` }}>
            <Sparkline values={kpi.sparkline} color={kpi.accent} />
          </Box>
        ) : null}
      </Box>
    </Card>
  );
}

function SummaryReadCard({ highest, lowest, readiness }: { highest: string; lowest: string; readiness: string }) {
  return (
    <Card sx={{ p: 2, height: "100%", bgcolor: brandTokens.blue50, border: `1px solid ${alpha(brandTokens.blue600, 0.18)}`, boxShadow: `0 10px 30px ${alpha(brandTokens.blue600, 0.08)}` }}>
      <Typography variant="overline" sx={{ color: brandTokens.blue700, letterSpacing: "0.06em", fontWeight: 900 }}>Executive readout</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
        Strongest: <b>{highest || "No data"}</b>. Priority: <b>{lowest || "No data"}</b>. Managed+ readiness stands at <b>{readiness}</b>.
      </Typography>
      <Box sx={{ mt: 1.4, height: 7, borderRadius: 999, bgcolor: alpha(brandTokens.blue600, 0.12), overflow: "hidden" }}>
        <Box sx={{ width: readiness, maxWidth: "100%", height: "100%", bgcolor: semanticTokens.successMain }} />
      </Box>
    </Card>
  );
}

function ReportFact({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha("#ffffff", 0.78), border: `1px solid ${alpha(brandTokens.blue600, 0.14)}`, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={850} noWrap title={value}>{value}</Typography>
    </Box>
  );
}

function HeroStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", p: 1.5, borderRadius: 2, bgcolor: alpha(tone, 0.06), border: `1px solid ${alpha(tone, 0.18)}`, minWidth: 0 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(tone, 0.14), color: tone, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{label}</Typography>
        <Typography variant="body2" fontWeight={900} noWrap title={value}>{value}</Typography>
      </Box>
    </Box>
  );
}

function MaturityJourney({ currentLevel }: { currentLevel: number }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${neutralTokens.line200}`, bgcolor: "background.default" }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>Maturity journey</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 0.75 }}>
        {STAGES.map((stage) => {
          const active = stage.level <= currentLevel;
          return (
            <Box key={stage.level} sx={{ minWidth: 0 }}>
              <Box sx={{ height: 8, borderRadius: 999, bgcolor: active ? stage.color : neutralTokens.line200 }} />
              <Typography variant="caption" color={active ? "text.primary" : "text.secondary"} sx={{ display: "block", mt: 0.6, fontWeight: active ? 800 : 600 }} noWrap>
                {stage.level}. {stage.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function DonutChart({ data, unit = "/100" }: { data: Array<{ name: string; value: number; color: string; percent: number }>; unit?: string }) {
  if (data.length === 0) return <EmptyState title="No data" description="Nothing to plot yet." />;
  return (
    <Box>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={2} isAnimationActive>
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
          </Pie>
          <Tooltip content={<PlainTooltip unit={unit} />} />
        </PieChart>
      </ResponsiveContainer>
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} justifyContent="center" sx={{ mt: 1 }}>
        {data.map((entry) => (
          <Stack key={entry.name} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: entry.color }} />
            <Typography variant="caption" color="text.secondary"><b>{entry.percent}%</b> {entry.name}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const tone = insightTone[insight.tone];
  return (
    <Card sx={{ p: 2.25, height: "100%", border: `1px solid ${alpha(tone.color, 0.18)}`, borderLeft: `4px solid ${tone.color}`, bgcolor: alpha(tone.surface, 0.55), boxShadow: `0 10px 28px ${alpha(tone.color, 0.08)}` }}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box sx={{ width: 30, height: 30, borderRadius: 2, bgcolor: alpha(tone.color, 0.12), color: tone.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={900} sx={{ color: tone.color }}>{insight.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>{insight.body}</Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function BreakdownTable({ groups, search, onSelect }: { groups: CategoryGroup[]; search: string; onSelect: (id: string) => void }) {
  const query = search.trim().toLowerCase();
  const rows = query ? groups.filter((g) => g.categoryName.toLowerCase().includes(query)) : groups;
  const best = groups.slice().sort((a, b) => b.score - a.score)[0]?.categoryId;
  const worst = groups.slice().sort((a, b) => a.score - b.score)[0]?.categoryId;

  if (rows.length === 0) return <EmptyState title="No match" description="No competency matches your search." />;

  return (
    <TableContainer>
      <Table sx={{ minWidth: 720 }} aria-label="Competency breakdown">
        <TableHead>
          <TableRow>
            <TableCell>Competency</TableCell>
            <TableCell>Maturity stage</TableCell>
            <TableCell align="center">Aligned</TableCell>
            <TableCell align="center">Answered</TableCell>
            <TableCell>Signal</TableCell>
            <TableCell align="right">Score</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((group) => (
            <TableRow
              key={group.categoryId}
              hover
              role="button"
              tabIndex={0}
              onClick={() => onSelect(group.categoryId)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(group.categoryId); } }}
              sx={{ cursor: "pointer" }}
            >
              <TableCell><Typography variant="body2" fontWeight={700}>{group.categoryName}</Typography></TableCell>
              <TableCell><StageChip stage={group.stage} /></TableCell>
              <TableCell align="center" sx={{ fontVariantNumeric: "tabular-nums" }}>{group.alignedCount}/{group.questionCount}</TableCell>
              <TableCell align="center" sx={{ fontVariantNumeric: "tabular-nums" }}>{group.answeredCount}/{group.questionCount}</TableCell>
              <TableCell>
                {group.categoryId === best ? <Chip size="small" label="Strength" sx={{ bgcolor: alpha(semanticTokens.successMain, 0.12), color: semanticTokens.successMain, fontWeight: 700 }} />
                  : group.categoryId === worst ? <Chip size="small" label="Weakness" sx={{ bgcolor: alpha(semanticTokens.errorMain, 0.12), color: semanticTokens.errorMain, fontWeight: 700 }} />
                  : group.stage.level <= 2 ? <Chip size="small" label="At risk" sx={{ bgcolor: alpha(semanticTokens.warningMain, 0.12), color: semanticTokens.warningMain, fontWeight: 700 }} />
                  : <Chip size="small" variant="outlined" label="Stable" />}
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-end">
                  <Box sx={{ width: 60, height: 6, borderRadius: 999, bgcolor: neutralTokens.line200, overflow: "hidden" }}>
                    <Box sx={{ width: `${group.score}%`, height: "100%", bgcolor: group.stage.color }} />
                  </Box>
                  <Typography variant="body2" fontWeight={800} sx={{ minWidth: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{group.score}</Typography>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DetailTreeRow({
  open,
  depth,
  title,
  meta,
  tone,
  onToggle,
}: {
  open: boolean;
  depth: number;
  title: string;
  meta?: string;
  tone: string;
  onToggle: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      aria-expanded={open}
      aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
      onClick={onToggle}
      sx={{
        width: "100%",
        boxSizing: "border-box",
        border: 0,
        bgcolor: "transparent",
        color: "inherit",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        textAlign: "left",
        px: 0.85,
        py: 0.7,
        pl: { xs: `${0.85 + depth * 1.15}rem`, md: `${0.95 + depth * 1.35}rem` },
        fontFamily: "inherit",
        transition: "background-color 180ms ease, color 180ms ease",
        "&:hover": { bgcolor: alpha(tone, 0.07) },
        "&:focus-visible": { outline: `2px solid ${alpha(tone, 0.55)}`, outlineOffset: -2 },
      }}
    >
      <KeyboardArrowRightIcon
        sx={{
          fontSize: 17,
          color: tone,
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 180ms ease, color 180ms ease",
          flexShrink: 0,
        }}
      />
      <Box sx={{ width: 17, height: 17, borderRadius: 1, bgcolor: alpha(tone, 0.1), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: tone }} />
      </Box>
      <Typography variant="body2" fontWeight={800} sx={{ fontSize: 12, lineHeight: 1.2, minWidth: 0, flexGrow: 1, overflowWrap: "anywhere" }}>
        {title}
      </Typography>
      <Stack component="span" direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
        {meta ? (
          <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap" }}>
            {meta}
          </Typography>
        ) : null}
        <Box
          component="span"
          sx={{
            height: 20,
            px: 0.75,
            borderRadius: 999,
            border: `1px solid ${alpha(tone, 0.35)}`,
            bgcolor: open ? alpha(tone, 0.14) : alpha(tone, 0.06),
            color: tone,
            display: "inline-flex",
            alignItems: "center",
            fontSize: 10.5,
            fontWeight: 900,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {open ? "Collapse" : "Expand"}
        </Box>
      </Stack>
    </Box>
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

function FactBox({ label, value, emphasize = false, tone = "default" }: { label: string; value: string; emphasize?: boolean; tone?: FactTone }) {
  const toneStyles: Record<FactTone, { borderColor: string; color: string; background: string }> = {
    default: { borderColor: neutralTokens.line200, color: neutralTokens.ink900, background: "background.paper" },
    success: { borderColor: alpha(semanticTokens.successMain, 0.3), color: semanticTokens.successMain, background: semanticTokens.successSurface },
    error: { borderColor: alpha(semanticTokens.errorMain, 0.32), color: semanticTokens.errorMain, background: semanticTokens.errorSurface },
  };
  const style = toneStyles[tone];

  return (
    <Box sx={{ px: 0.75, py: 0.55, border: 1, borderColor: style.borderColor, borderRadius: 1, bgcolor: style.background, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10, lineHeight: 1.1 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={emphasize ? 800 : 700} sx={{ mt: 0.25, color: style.color, fontSize: 12, lineHeight: 1.2, overflowWrap: "anywhere" }}>{value}</Typography>
    </Box>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{label}</Typography>
      <Typography variant="body2" fontWeight={700}>{value}</Typography>
    </Box>
  );
}

function FigureBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1, color, fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
    </Box>
  );
}

/* ------------------------------------------------------------------ *
 * Interpretation copy (plain business language)
 * ------------------------------------------------------------------ */
function strengthInterpretation(groups: CategoryGroup[]) {
  const best = groups.slice().sort((a, b) => b.score - a.score)[0];
  const worst = groups.slice().sort((a, b) => a.score - b.score)[0];
  if (!best || !worst) return null;
  return `Your shape is widest on ${best.categoryName} (${best.score}) and narrowest on ${worst.categoryName} (${worst.score}). A balanced shape signals consistent maturity; deep dents flag competencies to prioritise.`;
}

function rankingInterpretation(groups: CategoryGroup[]) {
  const worst = groups.slice().sort((a, b) => a.score - b.score)[0];
  if (!worst) return null;
  return `${worst.categoryName} sits at the bottom (${worst.score}/100). Lifting the lowest-ranked competency usually moves the overall score the most.`;
}

function distributionInterpretation(groups: CategoryGroup[]) {
  const managed = groups.filter((g) => g.stage.level >= 4).length;
  const total = groups.length || 1;
  const pct = Math.round((managed / total) * 100);
  return `${pct}% of competencies are at Managed maturity or higher. The more weight sits in the green stages, the more dependable your quality practices are.`;
}

function trendInterpretation(trend: Array<{ score: number }>) {
  const first = trend[0].score;
  const last = trend[trend.length - 1].score;
  const diff = last - first;
  if (diff === 0) return "Your maturity score has held steady across assessments. Target a specific weak competency to break the plateau.";
  return `Your maturity score has ${diff > 0 ? "risen" : "fallen"} ${Math.abs(diff)} points since your first assessment of this type. ${diff > 0 ? "Keep reinforcing what is working." : "Investigate which competencies slipped."}`;
}

function benchmarkInterpretation(score: number, average: number | null, previous: number | null) {
  const parts: string[] = [];
  if (previous != null) parts.push(`${score >= previous ? "ahead of" : "behind"} your previous assessment (${previous})`);
  if (average != null) parts.push(`${score >= average ? "above" : "below"} your running average (${average})`);
  const target = 85 - score;
  const gap = target > 0 ? `${target} points from the Optimized target (85).` : "already at or beyond the Optimized target (85).";
  return `This assessment (${score}) is ${parts.join(" and ") || "your first data point"}. You are ${gap}`;
}

function toStatus(status: number): EntityStatus {
  if (status === AssessmentStatus.Draft) return "Draft";
  if (status === AssessmentStatus.InProgress) return "InProgress";
  if (status === AssessmentStatus.Submitted) return "Submitted";
  if (status === AssessmentStatus.Scored) return "Scored";
  return "Archived";
}
