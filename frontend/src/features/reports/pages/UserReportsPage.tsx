import { Alert, Box, Button, Card, LinearProgress, Stack, Typography } from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, MaturityChip, PageHeader } from "shared/components";
import { maturityFor } from "shared/domain/maturity";
import { neutralTokens } from "app/theme/tokens/palette";
import { useAssessmentDashboardData } from "features/dashboard/assessmentData";

function Gauge({ value }: { value: number }) {
  const info = maturityFor(value);
  return (
    <Box sx={{ position: "relative", height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="78%"
          outerRadius="100%"
          data={[{ value }]}
          startAngle={220}
          endAngle={-40}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={999} fill={info.color} background={{ fill: neutralTokens.line200 }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ fontSize: 40, fontWeight: 600, lineHeight: 1 }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">
          / 100
        </Typography>
      </Box>
    </Box>
  );
}

export function UserReportsPage() {
  const dashboard = useAssessmentDashboardData();

  return (
    <Box>
      <PageHeader
        title="Assessment results"
        subtitle="Your maturity scorecard from completed assessments."
        actions={
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} disabled={dashboard.assessmentCount === 0}>
            Export PDF
          </Button>
        }
      />

      {dashboard.isLoading ? <LinearProgress sx={{ mb: 2 }} /> : null}
      {dashboard.isError ? <Alert severity="error" sx={{ mb: 2 }}>Unable to load your report data.</Alert> : null}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" } }}>
        <Card sx={{ p: 2.5, textAlign: "center" }}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Overall maturity
          </Typography>
          <Gauge value={dashboard.overallScore} />
          <Stack alignItems="center" sx={{ mt: 1 }}>
            <MaturityChip score={dashboard.overallScore} />
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Score by category
          </Typography>
          {dashboard.categoryScores.length === 0 ? (
            <EmptyState title="No category scores" description="Scores appear after your assessments are submitted and scored." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dashboard.categoryScores} layout="vertical" margin={{ left: 24, right: 24 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: neutralTokens.ink500, fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={110}
                  tick={{ fill: neutralTokens.ink700, fontSize: 12 }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={22}>
                  {dashboard.categoryScores.map((c) => (
                    <Cell key={c.category} fill={maturityFor(c.score).color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Box>

      <Card sx={{ p: 2.5, mt: 2 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Recommendations
        </Typography>
        {dashboard.topRecommendations.length === 0 ? (
          <EmptyState title="No recommendations" description="Recommendations appear after an assessment is scored." />
        ) : (
          <Stack spacing={2}>
            {dashboard.topRecommendations.map((recommendation) => (
              <Stack key={recommendation.id} direction="row" spacing={1.5} alignItems="flex-start">
                <LightbulbOutlinedIcon fontSize="small" color="primary" sx={{ mt: 0.25 }} />
                <Box>
                  <Typography variant="body2" fontWeight={700}>{recommendation.category}</Typography>
                  <Typography variant="body2" color="text.secondary">{recommendation.text}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>
    </Box>
  );
}
