import type { ReactNode } from "react";
import { Box, Card, Stack, Typography } from "@mui/material";
import { AnimatedNumber } from "features/dashboard/components/dashboardMotion";

interface MetricTileProps {
  label: string;
  value: number;
  format?: (n: number) => ReactNode;
  /** Small muted glyph shown at the top-right. */
  icon?: ReactNode;
  /** Thin left rule colour — a restrained category indicator, not decoration. */
  accent?: string;
  sub?: ReactNode;
  animate?: boolean;
}

/**
 * Dense, enterprise-style metric tile: neutral surface, hairline border,
 * a thin left indicator rule and a tabular figure. No gradients or lift.
 */
export function MetricTile({ label, value, format, icon, accent, sub, animate = true }: MetricTileProps) {
  return (
    <Card
      sx={{
        p: 2,
        height: "100%",
        borderLeft: accent ? `3px solid ${accent}` : undefined,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", letterSpacing: "0.06em" }}
        >
          {label}
        </Typography>
        {icon ? <Box sx={{ color: "text.disabled", display: "flex", fontSize: 18 }}>{icon}</Box> : null}
      </Stack>
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1.15,
          mt: 0.25,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
        }}
      >
        {animate ? <AnimatedNumber value={value} format={format} /> : format ? format(value) : Math.round(value)}
      </Typography>
      {sub ? (
        <Box sx={{ mt: 0.75, minHeight: 22 }}>
          {sub}
        </Box>
      ) : null}
    </Card>
  );
}
