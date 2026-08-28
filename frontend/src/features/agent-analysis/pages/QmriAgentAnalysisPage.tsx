import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PriorityHighOutlinedIcon from "@mui/icons-material/PriorityHighOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brandTokens, semanticTokens } from "app/theme/tokens/palette";
import { useAssessment, useQmriAgentAnalysis } from "shared/api/assessments";
import {
  AssessmentStatus,
  ScoreScope,
  type AssessmentQuestionResultDto,
  type QmriAgentAnalysisDto,
  type QmriAgentInsightDto,
} from "shared/api/types";
import { maturityFor } from "shared/domain/maturity";
import { RoutePaths } from "shared/constants/routePaths";
import "./qmriAgentAnalysis.css";

type AnalysisPhase = "active" | "complete" | "error";

interface CategoryMetric {
  category: string;
  score: number;
  color: string;
  maturity: string;
}

export function QmriAgentAnalysisPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const assessmentQuery = useAssessment(assessmentId);
  const isReady = (assessmentQuery.data?.summary.status ?? -1) >= AssessmentStatus.Scored;
  const analysisQuery = useQmriAgentAnalysis(assessmentId, Boolean(assessmentQuery.data && isReady));

  const answeredResponses = useMemo(
    () => (assessmentQuery.data?.questionResults ?? []).filter((response) => response.answer != null),
    [assessmentQuery.data?.questionResults],
  );
  const categories = useMemo(
    () => new Set(answeredResponses.map((response) => response.categoryName)).size,
    [answeredResponses],
  );
  const categoryMetrics = useMemo<CategoryMetric[]>(
    () => (assessmentQuery.data?.scores ?? [])
      .filter((score) => score.scope === ScoreScope.Category && score.categoryName)
      .map((score) => {
        const value = clampScore(score.score);
        const maturity = maturityDisplayForScore(value);
        return {
          category: score.categoryName as string,
          score: value,
          color: maturity.color,
          maturity: maturity.label,
        };
      })
      .sort((left, right) => right.score - left.score),
    [assessmentQuery.data?.scores],
  );

  if (assessmentQuery.isLoading) {
    return (
      <Box className="qmri-agent-page" aria-busy="true">
        <Typography component="h1" variant="h1">QMRI Agent analysis</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
          Preparing the assessment evidence trail.
        </Typography>
        <LinearProgress aria-label="Preparing assessment evidence" />
      </Box>
    );
  }

  if (!assessmentId || assessmentQuery.isError || !assessmentQuery.data) {
    return (
      <Box className="qmri-agent-page">
        <Typography component="h1" variant="h1">QMRI Agent analysis</Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          This assessment could not be loaded. Return to your assessments and try again.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate(RoutePaths.portalAssessments)}
          sx={{ mt: 2 }}
        >
          Return to assessments
        </Button>
      </Box>
    );
  }

  const pending = isReady && (analysisQuery.isPending || analysisQuery.isFetching);
  const phase: AnalysisPhase = !isReady || analysisQuery.isError
    ? "error"
    : analysisQuery.data
      ? "complete"
      : "active";
  const summary = assessmentQuery.data.summary;
  const analysis = analysisQuery.data;
  const responseCount = answeredResponses.length || summary.answeredCount;
  const reportAction = () => navigate(RoutePaths.portalReports, { state: { assessmentId } });
  const errorMessage = !isReady
    ? "This assessment must be submitted and scored before QMRI Agent can analyse it."
    : getAnalysisErrorMessage(analysisQuery.error);

  return (
    <Box className="qmri-agent-page">
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "flex-end" }}
        spacing={1.5}
        className="qmri-agent-heading"
      >
        <Box>
          <Typography className="qmri-agent-eyebrow">ASSESSMENT INTERPRETATION</Typography>
          <Typography component="h1" variant="h1">QMRI Agent analysis</Typography>
          <Typography component="p" variant="h3" sx={{ mt: 0.55 }}>{phase === "complete" ? "Executive maturity snapshot" : "Reading your responses"}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65 }}>
            {summary.title} · {formatAveragePercent(summary.overallScore ?? 0)}
          </Typography>
        </Box>
        <Chip
          icon={phase === "complete" ? <CheckCircleOutlineIcon /> : phase === "error" ? <ErrorOutlineIcon /> : <AutoAwesomeOutlinedIcon />}
          label={phase === "complete" ? "Analysis complete" : phase === "error" ? "Analysis unavailable" : "Assessment complete · Agent active"}
          className={`qmri-agent-phase-chip qmri-agent-phase-chip--${phase}`}
        />
      </Stack>

      {phase === "complete" && analysis ? (
        <ExecutiveAnalysisOverview
          analysis={analysis}
          overallScore={clampScore(summary.overallScore ?? 0)}
          categoryMetrics={categoryMetrics}
          responseCount={responseCount}
        />
      ) : (
        <Box className="qmri-agent-chamber">
          <Box component="section" aria-label="QMRI Agent scan field" className="qmri-agent-visual-column">
            <RobotScanField phase={phase} responseCount={responseCount} />
            <AggregateProgress
              phase={phase}
              pending={pending}
              responseCount={responseCount}
              categoryCount={categories}
            />
          </Box>

          <AgentConversation
            phase={phase}
            pending={pending}
            responseCount={responseCount}
            categoryCount={categories}
            agentMessage={analysis?.agentMessage}
            strongestSignal={analysis?.strongestSignal}
            errorMessage={errorMessage}
            onRetry={() => void analysisQuery.refetch()}
          />
        </Box>
      )}

      <ResponseTrail responses={answeredResponses} phase={phase} />

      <Box className="qmri-agent-controls">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
          {phase === "complete" ? (
            <Button variant="contained" onClick={reportAction} endIcon={<ArrowForwardOutlinedIcon />}>
              View full detailed report
            </Button>
          ) : phase === "error" ? (
            <>
              <Button
                variant="contained"
                startIcon={<ReplayOutlinedIcon />}
                onClick={() => void analysisQuery.refetch()}
                disabled={!isReady || analysisQuery.isFetching}
              >
                Try analysis again
              </Button>
              <Button variant="outlined" onClick={reportAction}>Open standard report</Button>
            </>
          ) : null}

          <Button
            variant={phase === "complete" ? "outlined" : "text"}
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => navigate(RoutePaths.portalAssessments)}
          >
            Return to assessments
          </Button>
        </Stack>

        <Stack direction="row" spacing={0.8} alignItems="flex-start" className="qmri-agent-trust-note">
          <InfoOutlinedIcon sx={{ fontSize: 17, mt: 0.15, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary">
            QMRI Agent feedback is generated from your assessment responses and is intended to support review and planning.
            Use the detailed report for the full evidence trail.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

function ExecutiveAnalysisOverview({
  analysis,
  overallScore,
  categoryMetrics,
  responseCount,
}: {
  analysis: QmriAgentAnalysisDto;
  overallScore: number;
  categoryMetrics: CategoryMetric[];
  responseCount: number;
}) {
  const overallBand = maturityDisplayForScore(overallScore);
  const leader = categoryMetrics[0];
  const focus = categoryMetrics[categoryMetrics.length - 1];
  const categorySpread = leader && focus ? Math.max(0, leader.score - focus.score) : 0;
  const scoreStyle = {
    "--score": overallScore,
    "--score-color": overallBand.color,
  } as CSSProperties;

  return (
    <Box component="section" aria-labelledby="executive-analysis-title" className="qmri-agent-executive">
      <Box className="qmri-agent-executive-heading">
        <Box>
          <Typography className="qmri-agent-eyebrow">MANAGEMENT VIEW</Typography>
          <Typography id="executive-analysis-title" component="h2" variant="h2">
            What the assessment means
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            A decision-ready view of maturity, risk and the next best moves.
          </Typography>
        </Box>
        <Chip
          size="small"
          icon={<CheckCircleOutlineIcon />}
          label={responseCount + " responses analysed"}
          className="qmri-agent-executive-chip"
        />
      </Box>

      <Box className="qmri-agent-executive-grid">
        <Card className="qmri-agent-score-card">
          <Typography variant="overline" color="text.secondary">Overall maturity</Typography>
          <Box
            className="qmri-agent-score-ring"
            style={scoreStyle}
            role="img"
            aria-label={"Average maturity score " + Math.round(overallScore) + " percent"}
          >
            <Box className="qmri-agent-score-ring-center">
              <strong>{Math.round(overallScore)}%</strong>
              <span>average score</span>
            </Box>
          </Box>
          <Typography component="p" variant="h3" className="qmri-agent-score-band">
            {overallBand.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", lineHeight: 1.5 }}>
            {formatAveragePercent(overallScore)} based on all scored responses.
          </Typography>
        </Card>

        <Card className="qmri-agent-category-card">
          <Box className="qmri-agent-card-heading">
            <Box>
              <Typography component="h3" variant="h3">Category performance</Typography>
              <Typography variant="caption" color="text.secondary">
                Ranked from strongest capability to highest attention area.
              </Typography>
            </Box>
            <Chip size="small" variant="outlined" label={categoryMetrics.length + " categories"} />
          </Box>
          {categoryMetrics.length > 0 ? (
            <>
              <Box className="qmri-agent-category-chart" role="img" aria-label="Maturity score by category">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryMetrics}
                    layout="vertical"
                    margin={{ top: 6, right: 38, left: 2, bottom: 2 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EDEDF0" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fill: "#616167", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={118}
                      tick={{ fill: "#323238", fontSize: 11, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip
                      cursor={{ fill: "rgba(15, 108, 189, 0.05)" }}
                      formatter={(value) => [Math.round(Number(value)) + "%", "Average score"]}
                      contentStyle={{ borderRadius: 6, border: "1px solid #E1E7EE", boxShadow: "0 8px 22px rgba(28, 60, 92, 0.12)" }}
                    />
                    <Bar dataKey="score" barSize={22} radius={[0, 5, 5, 0]}>
                      {categoryMetrics.map((metric) => (
                        <Cell key={metric.category} fill={metric.color} />
                      ))}
                      <LabelList dataKey="score" position="right" formatter={(value: number) => Math.round(value) + "%"} fill="#323238" fontSize={11} fontWeight={800} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box className="qmri-agent-chart-legend" aria-label="Maturity score guide">
                <span><i className="qmri-agent-legend-dot qmri-agent-legend-dot--risk" />0-30 Foundation</span>
                <span><i className="qmri-agent-legend-dot qmri-agent-legend-dot--build" />31-60 Building</span>
                <span><i className="qmri-agent-legend-dot qmri-agent-legend-dot--scale" />61-80 Scaling</span>
                <span><i className="qmri-agent-legend-dot qmri-agent-legend-dot--lead" />81-100 Leading</span>
              </Box>
            </>
          ) : (
            <Box className="qmri-agent-chart-empty">
              <Typography variant="body2" color="text.secondary">
                Category scores are not available for this assessment.
              </Typography>
            </Box>
          )}
        </Card>

        <Card className="qmri-agent-brief-card">
          <Stack direction="row" spacing={1} alignItems="center">
            <Box className="qmri-agent-brief-icon"><AutoAwesomeOutlinedIcon /></Box>
            <Box>
              <Typography component="h3" variant="h3">Executive interpretation</Typography>
              <Typography variant="caption" color="text.secondary">Plain-language management brief</Typography>
            </Box>
          </Stack>
          <Typography variant="body2" className="qmri-agent-brief-copy">
            {analysis.agentMessage}
          </Typography>
          <Box className="qmri-agent-signal-callout">
            <Typography variant="overline">Strongest signal</Typography>
            <Typography variant="body2">{analysis.strongestSignal}</Typography>
          </Box>
        </Card>
      </Box>

      <Box className="qmri-agent-signal-grid">
        <Box className="qmri-agent-signal-stat qmri-agent-signal-stat--positive">
          <VerifiedOutlinedIcon />
          <Box>
            <Typography variant="overline">Leading capability</Typography>
            <Typography component="p" variant="h3">{leader?.category ?? "Not available"}</Typography>
            <Typography variant="caption" color="text.secondary">
              {leader ? formatAveragePercent(leader.score) + " - " + leader.maturity : "No category score available"}
            </Typography>
          </Box>
        </Box>
        <Box className="qmri-agent-signal-stat qmri-agent-signal-stat--attention">
          <PriorityHighOutlinedIcon />
          <Box>
            <Typography variant="overline">Immediate attention</Typography>
            <Typography component="p" variant="h3">{focus?.category ?? "Not available"}</Typography>
            <Typography variant="caption" color="text.secondary">
              {focus ? formatAveragePercent(focus.score) + " - " + focus.maturity : "No category score available"}
            </Typography>
          </Box>
        </Box>
        <Box className="qmri-agent-signal-stat">
          <AutoAwesomeOutlinedIcon />
          <Box>
            <Typography variant="overline">Capability spread</Typography>
            <Typography component="p" variant="h3">{Math.round(categorySpread)} points</Typography>
            <Typography variant="caption" color="text.secondary">
              Difference between the strongest and weakest categories.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box className="qmri-agent-next-move">
        <Box className="qmri-agent-next-move-index">01</Box>
        <Box>
          <Typography variant="overline">Recommended first move</Typography>
          <Typography component="p" variant="h3">{analysis.nextStep}</Typography>
        </Box>
        <ArrowForwardOutlinedIcon aria-hidden="true" />
      </Box>

      <Box className="qmri-agent-feedback-heading">
        <Typography component="h2" variant="h2">Decision guide</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Use the evidence below to protect strengths, address exposure and sequence improvement work.
        </Typography>
      </Box>

      <Box className="qmri-agent-insight-grid">
        <InsightSection
          className="qmri-agent-insight--strength"
          title="Protect"
          subtitle="Capabilities to preserve"
          items={analysis.strengths}
          icon={<VerifiedOutlinedIcon />}
          tone={semanticTokens.successMain}
          surface={semanticTokens.successSurface}
        />
        <InsightSection
          className="qmri-agent-insight--gap"
          title="Address"
          subtitle="Risks requiring attention"
          items={analysis.priorityGaps}
          icon={<PriorityHighOutlinedIcon />}
          tone={semanticTokens.warningMain}
          surface={semanticTokens.warningSurface}
        />
        <InsightSection
          className="qmri-agent-insight--action"
          title="Act"
          subtitle="Recommended management actions"
          items={analysis.recommendedActions}
          icon={<ArrowForwardOutlinedIcon />}
          tone={brandTokens.blue600}
          surface={brandTokens.blue50}
        />
      </Box>
    </Box>
  );
}
function RobotScanField({ phase, responseCount }: { phase: AnalysisPhase; responseCount: number }) {
  return (
    <Box className={`qmri-agent-scan-field qmri-agent-scan-field--${phase}`}>
      <Box className="qmri-agent-dot-grid" aria-hidden="true" />
      <Box className="qmri-agent-center-glow" aria-hidden="true" />
      <Box className="qmri-agent-robot-head" aria-hidden="true">
        <Box className="qmri-agent-robot-antenna">
          <span />
        </Box>
        <Box className="qmri-agent-robot-shell">
          <Box className="qmri-agent-robot-ear qmri-agent-robot-ear--left" />
          <Box className="qmri-agent-robot-ear qmri-agent-robot-ear--right" />
          <Box className="qmri-agent-robot-faceplate">
            <Box className="qmri-agent-robot-brow" />
            <Box className="qmri-agent-robot-eye-row">
              <span className="qmri-agent-robot-eye" />
              <span className="qmri-agent-robot-eye" />
            </Box>
            <Box className="qmri-agent-robot-mouth">
              <i />
              <i />
              <i />
            </Box>
          </Box>
          <Box className="qmri-agent-robot-jaw" />
        </Box>
        <Box className="qmri-agent-robot-neck" />
        <Box className="qmri-agent-robot-shadow" />
      </Box>
      {[0, 1, 2].map((ring) => (
        <Box key={ring} className={`qmri-agent-ring qmri-agent-ring--${ring + 1}`} aria-hidden="true" />
      ))}
      <Box className="qmri-agent-sweep-arc" aria-hidden="true" />
      <Box className="qmri-agent-rays" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className="qmri-agent-ray"
            style={{ "--ray-index": index, "--ray-angle": `${index * 45}deg` } as CSSProperties}
          />
        ))}
      </Box>
      <Box className="qmri-agent-response-badge" aria-hidden="true">
        <span>{String(responseCount).padStart(2, "0")}</span>
        <small>responses</small>
      </Box>
    </Box>
  );
}

function AggregateProgress({
  phase,
  pending,
  responseCount,
  categoryCount,
}: {
  phase: AnalysisPhase;
  pending: boolean;
  responseCount: number;
  categoryCount: number;
}) {
  const progressLabel = phase === "complete"
    ? `${responseCount} responses analysed together`
    : phase === "error"
      ? `Analysis paused · ${responseCount} responses remain ready`
      : `Reviewing ${responseCount} submitted responses together`;

  return (
    <Card className="qmri-agent-progress-card">
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography variant="overline" color="text.secondary">Aggregate response review</Typography>
          <Typography variant="h3" sx={{ mt: 0.15 }}>{progressLabel}</Typography>
        </Box>
        <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ whiteSpace: "nowrap" }}>
          {phase === "complete" ? "100%" : pending ? "In progress" : "Ready"}
        </Typography>
      </Stack>
      <LinearProgress
        variant={pending ? "indeterminate" : "determinate"}
        value={phase === "complete" ? 100 : 0}
        aria-label={progressLabel}
        sx={{ mt: 1.5, height: 7, borderRadius: 999 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        {responseCount} answered responses · {categoryCount} {categoryCount === 1 ? "category" : "categories"} · one real analysis request
      </Typography>
    </Card>
  );
}

function AgentConversation({
  phase,
  pending,
  responseCount,
  categoryCount,
  agentMessage,
  strongestSignal,
  errorMessage,
  onRetry,
}: {
  phase: AnalysisPhase;
  pending: boolean;
  responseCount: number;
  categoryCount: number;
  agentMessage?: string;
  strongestSignal?: string;
  errorMessage: string;
  onRetry: () => void;
}) {
  return (
    <Card component="aside" className="qmri-agent-conversation" aria-label="Conversation with QMRI Agent">
      <Box className="qmri-agent-conversation-header">
        <Box className="qmri-agent-avatar"><AutoAwesomeOutlinedIcon /></Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h3">QMRI Agent</Typography>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <span className={`qmri-agent-status-dot qmri-agent-status-dot--${phase}`} aria-hidden="true" />
            <Typography variant="caption" color="text.secondary">
              {phase === "complete" ? "Online · analysis complete" : phase === "error" ? "Feedback service unavailable" : "Online · analysing your assessment"}
            </Typography>
          </Stack>
        </Box>
      </Box>

      <Box className="qmri-agent-live-region" aria-live="polite" aria-atomic="true">
        {phase === "error" ? (
          <Box className="qmri-agent-error-message">
            <ErrorOutlineIcon />
            <Box>
              <Typography variant="subtitle2" fontWeight={800}>I could not complete the interpretation.</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{errorMessage}</Typography>
              <Button size="small" startIcon={<ReplayOutlinedIcon />} onClick={onRetry} sx={{ mt: 1 }}>
                Retry analysis
              </Button>
            </Box>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            <Box className="qmri-agent-message-bubble">
              <Typography variant="body1">
                {phase === "complete"
                  ? "I have finished reading your submitted responses and checked the result against the QMRI maturity framework."
                  : `I am reviewing all ${responseCount} submitted responses together against the QMRI maturity framework.`}
              </Typography>
            </Box>
            <AnalysisTerminal
              phase={phase}
              pending={pending}
              responseCount={responseCount}
              categoryCount={categoryCount}
              strongestSignal={strongestSignal}
            />
            {phase === "complete" && agentMessage ? (
              <Box className="qmri-agent-message-bubble qmri-agent-message-bubble--accent">
                <Typography variant="body1">{agentMessage}</Typography>
                {strongestSignal ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Strongest signal · {strongestSignal}
                  </Typography>
                ) : null}
              </Box>
            ) : null}
            {pending ? (
              <Stack direction="row" spacing={0.6} alignItems="center" className="qmri-agent-typing" aria-label="QMRI Agent is preparing feedback">
                <span /><span /><span />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>Preparing evidence-based feedback</Typography>
              </Stack>
            ) : null}
          </Stack>
        )}
      </Box>

      <Box className="qmri-agent-conversation-footer">
        <Typography variant="caption" color="text.secondary">
          {phase === "complete" ? `${responseCount} of ${responseCount} responses included` : `${responseCount} responses submitted for aggregate review`}
        </Typography>
      </Box>
    </Card>
  );
}

function AnalysisTerminal({
  phase,
  pending,
  responseCount,
  categoryCount,
  strongestSignal,
}: {
  phase: AnalysisPhase;
  pending: boolean;
  responseCount: number;
  categoryCount: number;
  strongestSignal?: string;
}) {
  const lines = [
    { step: "resolve", detail: "Loaded scored assessment snapshot" },
    { step: "index", detail: `Indexed ${responseCount} answered responses` },
    { step: "cluster", detail: `Mapped evidence across ${categoryCount} maturity categories` },
    { step: "score", detail: "Comparing score variance and category signals" },
    { step: "reason", detail: phase === "complete" ? "Generated strengths, gaps and actions" : "Drafting strengths, gaps and actions" },
    { step: "compile", detail: phase === "complete" ? "Analysis payload ready" : "Preparing response narrative" },
  ];
  const activeIndex = phase === "complete" ? lines.length : pending ? 4 : 1;
  const promptText = phase === "complete"
    ? `strongest signal: ${strongestSignal ?? "analysis complete"}`
    : pending
      ? "streaming maturity interpretation..."
      : "waiting for analysis request...";

  return (
    <Box
      className={`qmri-agent-terminal qmri-agent-terminal--${phase}`}
      role="status"
      aria-live={pending ? "polite" : "off"}
      aria-label="QMRI Agent analysis activity log"
    >
      <Box className="qmri-agent-terminal-header">
        <span className="qmri-agent-terminal-lights" aria-hidden="true"><i /><i /><i /></span>
        <Typography component="p" className="qmri-agent-terminal-title">analysis runtime</Typography>
        <Typography component="p" className="qmri-agent-terminal-status">
          {phase === "complete" ? "done" : pending ? "running" : "ready"}
        </Typography>
      </Box>
      <Box className="qmri-agent-terminal-body">
        {lines.map((line, index) => {
          const state = phase === "complete"
            ? "complete"
            : index < activeIndex
              ? "complete"
              : index === activeIndex
                ? "active"
                : "queued";

          return (
            <Box
              key={line.step}
              className={`qmri-agent-log-line qmri-agent-log-line--${state}`}
              style={{ "--line-index": index } as CSSProperties}
            >
              <span className="qmri-agent-log-time">{`00:${String((index + 1) * 3).padStart(2, "0")}`}</span>
              <span className="qmri-agent-log-state">{state === "complete" ? "done" : state === "active" ? "run" : "wait"}</span>
              <span className="qmri-agent-log-detail">{line.detail}</span>
            </Box>
          );
        })}
        <Box className="qmri-agent-terminal-prompt">
          <span>qmri-agent</span>
          <strong>{promptText}</strong>
        </Box>
      </Box>
    </Box>
  );
}
function ResponseTrail({ responses, phase }: { responses: AssessmentQuestionResultDto[]; phase: AnalysisPhase }) {
  return (
    <Box component="section" aria-labelledby="response-trail-title" className="qmri-agent-trail-section">
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={0.5}>
        <Box>
          <Typography id="response-trail-title" component="h2" variant="h3">Response trail</Typography>
          <Typography variant="caption" color="text.secondary">
            {phase === "complete" ? "Every answered response was included in the aggregate analysis." : "Responses stay queued until the aggregate analysis returns."}
          </Typography>
        </Box>
        <Chip
          size="small"
          variant="outlined"
          icon={phase === "complete" ? <CheckCircleOutlineIcon /> : phase === "error" ? <ErrorOutlineIcon /> : <ScheduleOutlinedIcon />}
          label={phase === "complete" ? "Included" : phase === "error" ? "Request failed · responses preserved" : "Submitted"}
        />
      </Stack>

      <Box className="qmri-agent-response-trail" role="list" aria-label={`${responses.length} submitted assessment responses`}>
        {responses.map((response, index) => {
          const state = phase === "complete" ? "complete" : "queued";
          const label = `Response ${index + 1}: ${response.categoryName} · ${state}`;
          return (
            <Tooltip key={response.questionId} title={`${response.categoryName} · ${response.moduleName}`} arrow>
              <Box className={`qmri-agent-response-step qmri-agent-response-step--${state}`} role="listitem" aria-label={label}>
                {state === "complete" ? <CheckCircleOutlineIcon /> : <ScheduleOutlinedIcon />}
                <span>{String(index + 1).padStart(2, "0")}</span>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

function InsightSection({
  className,
  title,
  subtitle,
  items,
  icon,
  tone,
  surface,
}: {
  className: string;
  title: string;
  subtitle: string;
  items: QmriAgentInsightDto[];
  icon: ReactNode;
  tone: string;
  surface: string;
}) {
  return (
    <Card
      className={`qmri-agent-insight ${className}`}
      sx={{ "--insight-tone": tone, "--insight-surface": surface } as CSSProperties}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box className="qmri-agent-insight-icon">{icon}</Box>
        <Box>
          <Typography component="h3" variant="h3">{title}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
      </Stack>
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {items.map((item, index) => (
          <Box key={`${item.title}-${index}`} className="qmri-agent-insight-item">
            <Typography variant="subtitle2" fontWeight={850}>{item.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>{item.summary}</Typography>
            <Typography variant="caption" className="qmri-agent-evidence">Evidence · {item.evidence}</Typography>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
}

function maturityDisplayForScore(score: number) {
  const normalized = Math.round(clampScore(score));
  const base = maturityFor(normalized);
  const label = normalized <= 30
    ? "Foundation"
    : normalized <= 60
      ? "Building"
      : normalized <= 80
        ? "Scaling"
        : "Leading";

  return {
    label,
    color: base.color,
  };
}

function formatAveragePercent(score: number) {
  return `Average is ${Math.round(clampScore(score))} percent`;
}

function getAnalysisErrorMessage(error: unknown) {
  if (isAxiosError<{ detail?: string }>(error) && error.response?.data?.detail) {
    return error.response.data.detail;
  }

  return "QMRI Agent could not complete the analysis. Try again or use the detailed report, which remains the source of truth.";
}
