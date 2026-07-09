import { Box, Card, Stack, Typography } from "@mui/material";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { EmptyState } from "shared/components";
import { dataTokens } from "app/theme/tokens/palette";
import type { BandDistributionItem } from "../assessmentData";

const COLORS: Record<string, string> = {
  Testing: dataTokens.bandTesting,
  QA: dataTokens.bandQA,
  QE: dataTokens.bandQE,
  IQ: dataTokens.bandIQ,
};

export function BandDonut({ data }: { data: BandDistributionItem[] }) {
  const activeData = data.filter((d) => d.value > 0);
  const total = activeData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="h3" gutterBottom>
        Maturity band distribution
      </Typography>
      {total === 0 ? (
        <EmptyState title="No scored assessments" description="Band distribution appears after scoring." />
      ) : (
        <>
          <Box sx={{ position: "relative" }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={activeData} dataKey="value" innerRadius={62} outerRadius={90} paddingAngle={2} stroke="none">
                  {activeData.map((d) => (
                    <Cell key={d.name} fill={COLORS[d.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <Typography sx={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{total}</Typography>
              <Typography variant="caption" color="text.secondary">
                assessments
              </Typography>
            </Box>
          </Box>
          <Stack spacing={0.75} sx={{ mt: 1.5 }}>
            {data.map((d) => (
              <Stack key={d.name} direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: COLORS[d.name] }} />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {d.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {d.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </>
      )}
    </Card>
  );
}
