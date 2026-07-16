import type { ReactNode } from "react";
import { Box, Card, Stack, Tooltip as MuiTooltip, Typography } from "@mui/material";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { alpha } from "@mui/material/styles";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Line, LineChart } from "recharts";
import { brandTokens, neutralTokens } from "app/theme/tokens/palette";
import type { HeatRow } from "./reportAnalytics";

/* Section card with heading + optional "what this means" footnote. */
export function ChartCard({
  title,
  subtitle,
  action,
  interpretation,
  children,
  minHeight,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  interpretation?: ReactNode;
  children: ReactNode;
  minHeight?: number;
}) {
  return (
    <Card
      sx={{
        p: { xs: 2, md: 2.5 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${neutralTokens.line200}`,
        boxShadow: "0 12px 34px rgba(15, 23, 42, 0.07)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5} sx={{ mb: subtitle ? 1.5 : 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 8, height: 26, borderRadius: 999, bgcolor: brandTokens.blue600 }} />
            <Typography variant="h3">{title}</Typography>
          </Stack>
          {subtitle ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 2.25 }}>{subtitle}</Typography> : null}
        </Box>
        {action}
      </Stack>
      <Box sx={{ flexGrow: 1, minHeight }}>{children}</Box>
      {interpretation ? <InterpretationNote>{interpretation}</InterpretationNote> : null}
    </Card>
  );
}

/* Plain-language "what this means / what to do" callout under a chart. */
export function InterpretationNote({ children }: { children: ReactNode }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="flex-start"
      sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: brandTokens.blue50, border: `1px solid ${alpha(brandTokens.blue600, 0.18)}` }}
    >
      <LightbulbOutlinedIcon sx={{ fontSize: 18, color: brandTokens.blue600, mt: 0.1 }} />
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>{children}</Typography>
    </Stack>
  );
}

/* Large circular gauge for the overall score. */
export function ScoreGauge({ score, color, size = 200, label }: { score: number; color: string; size?: number; label?: string }) {
  const data = [{ name: "score", value: Math.max(0, Math.min(100, score)) }];
  return (
    <Box sx={{ position: "relative", width: size, height: size, mx: "auto" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="76%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: neutralTokens.line200 }} dataKey="value" cornerRadius={999} fill={color} isAnimationActive />
        </RadialBarChart>
      </ResponsiveContainer>
      <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ fontSize: size * 0.28, fontWeight: 800, lineHeight: 1, color, fontVariantNumeric: "tabular-nums" }}>{Math.round(score)}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.04em" }}>{label ?? "/ 100"}</Typography>
      </Box>
    </Box>
  );
}

/* Tiny sparkline for KPI tiles. */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values || values.length < 2) return null;
  const data = values.map((value, index) => ({ index, value }));
  return (
    <Box sx={{ width: 72, height: 24 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

/* Recharts custom tooltip rendered in plain business language. */
export function PlainTooltip({ active, payload, label, unit = "/100" }: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string; dataKey?: string }>;
  label?: string | number;
  unit?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "background.paper", border: `1px solid ${neutralTokens.line300}`, boxShadow: "0 6px 24px rgba(0,0,0,0.10)", maxWidth: 260 }}>
      {label != null ? <Typography variant="caption" fontWeight={800} sx={{ display: "block", mb: 0.5 }}>{label}</Typography> : null}
      <Stack spacing={0.5}>
        {payload.map((entry, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: entry.color ?? brandTokens.blue600 }} />
              <Typography variant="caption" color="text.secondary">{entry.name ?? entry.dataKey}</Typography>
            </Stack>
            <Typography variant="caption" fontWeight={800} sx={{ fontVariantNumeric: "tabular-nums" }}>
              {typeof entry.value === "number" ? `${Math.round(entry.value)}${unit}` : entry.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

/* Competency-by-module heatmap grid. */
export function Heatmap({ rows, onSelect, selectedId }: { rows: HeatRow[]; onSelect?: (categoryId: string) => void; selectedId?: string | null }) {
  return (
    <Stack spacing={1}>
      {rows.map((row) => (
        <Box
          key={row.categoryId}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "120px 1fr", md: "180px 1fr" },
            gap: 1,
            alignItems: "center",
            p: 0.5,
            borderRadius: 2,
            outline: selectedId === row.categoryId ? `2px solid ${brandTokens.blue500}` : "none",
          }}
        >
          <Typography variant="caption" fontWeight={700} noWrap title={row.categoryName}>{row.categoryName}</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {row.cells.map((cell) => (
              <MuiTooltip key={cell.key} arrow title={`${cell.moduleName}: ${cell.score}/100 - ${cell.stageLabel}`}>
                <Box
                  onClick={onSelect ? () => onSelect(row.categoryId) : undefined}
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1.5,
                    bgcolor: alpha(cell.color, 0.18),
                    border: `1px solid ${alpha(cell.color, 0.4)}`,
                    color: cell.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: onSelect ? "pointer" : "default",
                    fontVariantNumeric: "tabular-nums",
                    transition: "box-shadow 150ms ease, border-color 150ms ease, background-color 150ms ease",
                    "&:hover": onSelect ? { boxShadow: `0 0 0 3px ${alpha(cell.color, 0.16)}`, borderColor: alpha(cell.color, 0.65), bgcolor: alpha(cell.color, 0.24) } : undefined,
                  }}
                >
                  {cell.score}
                </Box>
              </MuiTooltip>
            ))}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

/* Colour-swatch legend row. */
export function LegendRow({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
      {items.map((item) => (
        <Stack key={item.label} direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: item.color }} />
          <Typography variant="caption" color="text.secondary">{item.label}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}
