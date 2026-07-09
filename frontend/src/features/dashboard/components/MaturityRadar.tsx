import { Card, Typography } from "@mui/material";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "shared/components";
import { brandTokens, neutralTokens } from "app/theme/tokens/palette";
import type { CategoryScore } from "../assessmentData";

export function MaturityRadar({ data }: { data: CategoryScore[] }) {
  return (
    <Card sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="h3" gutterBottom>
        Maturity by category
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Average score (0-100) across categories from scored assessments.
      </Typography>
      {data.length === 0 ? (
        <EmptyState title="No category scores" description="Submit and score assessments to populate this chart." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke={neutralTokens.line200} />
            <PolarAngleAxis dataKey="category" tick={{ fill: neutralTokens.ink500, fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: neutralTokens.ink400, fontSize: 10 }} />
            <Radar
              dataKey="score"
              stroke={brandTokens.blue600}
              fill={brandTokens.blue500}
              fillOpacity={0.28}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
