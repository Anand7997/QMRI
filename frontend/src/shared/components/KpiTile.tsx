import type { ReactNode } from "react";
import { Box, Card, Stack, Typography } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { semanticTokens } from "app/theme/tokens/palette";

interface KpiTileProps {
  label: string;
  value: ReactNode;
  delta?: number;
  deltaSuffix?: string;
  icon?: ReactNode;
  footer?: ReactNode;
}

export function KpiTile({ label, value, delta, deltaSuffix = "", icon, footer }: KpiTileProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card sx={{ p: 2.5, height: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        {icon && <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>}
      </Stack>
      <Typography sx={{ fontSize: 32, fontWeight: 600, lineHeight: 1.15, mt: 0.5, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
        {delta !== undefined && (
          <Stack
            direction="row"
            spacing={0.25}
            alignItems="center"
            sx={{ color: up ? semanticTokens.successMain : semanticTokens.errorMain, fontSize: 13, fontWeight: 600 }}
          >
            {up ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />}
            {Math.abs(delta)}
            {deltaSuffix}
          </Stack>
        )}
        {footer}
      </Stack>
    </Card>
  );
}
