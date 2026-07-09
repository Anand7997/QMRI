import { Box, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import type { ChartSeries } from "../../types/ui";

export type AppChartType = "line" | "bar" | "radar";

export interface AppChartProps<T extends Record<string, unknown>> {
  type: AppChartType;
  data: T[];
  xKey: keyof T & string;
  series: ChartSeries[];
  height?: number;
  showGrid?: boolean;
  emptyLabel?: string;
}

const fallbackColors = ["#2E5E8A", "#0C8599", "#5C7CFA", "#E67700", "#C2255C"];

export function AppChart<T extends Record<string, unknown>>({
  type,
  data,
  xKey,
  series,
  height = 320,
  showGrid = true,
  emptyLabel = "No chart data available.",
}: AppChartProps<T>) {
  if (data.length === 0 || series.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: "grid",
          placeItems: "center",
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height }}>
      <ResponsiveContainer>
        {type === "line" ? (
          <LineChart data={data}>
            {showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null}
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {series.map((entry, index) => (
              <Line
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                name={entry.label}
                stroke={entry.color ?? fallbackColors[index % fallbackColors.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        ) : type === "bar" ? (
          <BarChart data={data}>
            {showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null}
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {series.map((entry, index) => (
              <Bar
                key={entry.key}
                dataKey={entry.key}
                name={entry.label}
                fill={entry.color ?? fallbackColors[index % fallbackColors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        ) : (
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={xKey} />
            <PolarRadiusAxis />
            <Tooltip />
            <Legend />
            {series.map((entry, index) => (
              <Radar
                key={entry.key}
                dataKey={entry.key}
                name={entry.label}
                stroke={entry.color ?? fallbackColors[index % fallbackColors.length]}
                fill={entry.color ?? fallbackColors[index % fallbackColors.length]}
                fillOpacity={0.28}
              />
            ))}
          </RadarChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}
