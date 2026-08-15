import { Alert, Box, Card, Chip, LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, KpiTile, MaturityChip, PageHeader, StatusChip } from "shared/components";
import { maturityFor } from "shared/domain/maturity";
import { neutralTokens, semanticTokens } from "app/theme/tokens/palette";
import { useAssessmentDashboardData, type RecommendationItem } from "features/dashboard/assessmentData";
import { ExportCenter } from "features/dashboard/components/ExportCenter";

const priorityColor: Record<RecommendationItem["priority"], string> = {
  Critical: semanticTokens.errorMain,
  High: semanticTokens.warningMain,
  Medium: semanticTokens.infoMain,
  Low: semanticTokens.successMain,
};

export function ReportsPage() {
  const dashboard = useAssessmentDashboardData();
  const highPriorityCount = dashboard.topRecommendations.filter(
    (recommendation) => recommendation.priority === "High" || recommendation.priority === "Critical",
  ).length;

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Assessment performance, maturity trends and priority recommendations."
      />

      {dashboard.isLoading ? <LinearProgress sx={{ mb: 2 }} /> : null}
      {dashboard.isError ? <Alert severity="error" sx={{ mb: 2 }}>Unable to load report data.</Alert> : null}

      <Box sx={{ mb: 2 }}>
        <ExportCenter title="Reports Export Center" scope="Admin" assessments={dashboard.assessments} details={dashboard.details} actor="Admin" />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" } }}>
        <KpiTile label="Overall maturity" value={dashboard.overallScore} icon={<InsightsOutlinedIcon />} footer={<MaturityChip score={dashboard.overallScore} />} />
        <KpiTile label="Avg completion" value={`${dashboard.averageCompletion}%`} icon={<TrendingUpOutlinedIcon />} />
        <KpiTile label="Assessments" value={dashboard.assessmentCount} icon={<AssessmentOutlinedIcon />} />
        <KpiTile label="High priority" value={highPriorityCount} icon={<WarningAmberOutlinedIcon />} />
      </Box>

      <Box sx={{ display: "grid", gap: 2, mt: 2, gridTemplateColumns: { xs: "1fr", xl: "1.25fr 1fr" } }}>
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h3">Maturity trend</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Maturity score and completion rate from scored assessments.
              </Typography>
            </Box>
            <Chip size="small" label="Real data" />
          </Stack>
          {dashboard.trendData.length === 0 ? (
            <EmptyState title="No trend data" description="Scored assessments are required for trend reporting." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dashboard.trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={neutralTokens.line200} />
                <XAxis dataKey="month" tick={{ fill: neutralTokens.ink500, fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: neutralTokens.ink500, fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" name="Maturity score" stroke={semanticTokens.infoMain} strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="completion" name="Completion" stroke={semanticTokens.successMain} strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            Category score
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current maturity score by assessment category.
          </Typography>
          {dashboard.categoryScores.length === 0 ? (
            <EmptyState title="No category scores" description="Category scores appear after assessments are scored." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboard.categoryScores} layout="vertical" margin={{ left: 24, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={neutralTokens.line200} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: neutralTokens.ink500, fontSize: 12 }} />
                <YAxis type="category" dataKey="category" width={120} tick={{ fill: neutralTokens.ink700, fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={22}>
                  {dashboard.categoryScores.map((category) => (
                    <Cell key={category.category} fill={maturityFor(category.score).color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Box>

      <Box sx={{ display: "grid", gap: 2, mt: 2, gridTemplateColumns: { xs: "1fr", xl: "1.35fr 1fr" } }}>
        <Card>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2.5, py: 2 }}>
            <GroupsOutlinedIcon color="primary" />
            <Typography variant="h3">Recent assessment reports</Typography>
          </Stack>
          {dashboard.recentAssessments.length === 0 ? (
            <EmptyState title="No reports" description="Create assessments to see report rows here." />
          ) : (
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Table sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Assessment</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Assigned by</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Submitted</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboard.recentAssessments.map((assessment) => (
                    <TableRow key={assessment.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight={700}>{assessment.title}</Typography>
                      </TableCell>
                      <TableCell><StatusChip status={assessment.status} /></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {assessment.takenPeopleCount}/{assessment.assignedPeopleCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {assessment.takenPeopleCount}/{assessment.assignedPeopleCount} people taken exam
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {assessment.assignedByFullName?.trim() || assessment.assignedByUserName?.trim() || "Unknown"}
                        </Typography>
                        {assessment.assignedByUserName ? (
                          <Typography variant="caption" color="text.secondary">
                            {assessment.assignedByUserName}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>{formatDate(assessment.createdAtUtc)}</TableCell>
                      <TableCell>{formatDate(assessment.submittedAtUtc)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Recommendation priorities
          </Typography>
          {dashboard.topRecommendations.length === 0 ? (
            <EmptyState title="No recommendations" description="Recommendations appear after assessments are scored." />
          ) : (
            <Stack spacing={1.5}>
              {dashboard.topRecommendations.map((recommendation) => (
                <Stack key={recommendation.id} spacing={0.75} sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={700}>{recommendation.category}</Typography>
                    <Chip
                      size="small"
                      label={recommendation.priority}
                      sx={{
                        bgcolor: `${priorityColor[recommendation.priority]}20`,
                        color: priorityColor[recommendation.priority],
                        fontWeight: 700,
                      }}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {recommendation.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Card>
      </Box>
    </Box>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}



