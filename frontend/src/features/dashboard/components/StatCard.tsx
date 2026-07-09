import type { ReactNode } from "react";
import { Box, Card, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { motion } from "motion/react";
import { semanticTokens } from "app/theme/tokens/palette";
import { AnimatedNumber, riseItem } from "./dashboardMotion";

const MotionCard = motion.create(Card);

export interface StatCardProps {
  label: string;
  value: number;
  /** Format the animated value (e.g. append %, or show a maturity label). */
  format?: (n: number) => ReactNode;
  icon: ReactNode;
  /** Accent colour for the icon chip + top bar. */
  accent: string;
  delta?: number;
  deltaSuffix?: string;
  footer?: ReactNode;
}

export function StatCard({
  label,
  value,
  format,
  icon,
  accent,
  delta,
  deltaSuffix = "",
  footer,
}: StatCardProps) {
  const up = (delta ?? 0) >= 0;

  return (
    <MotionCard
      variants={riseItem}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      sx={{
        p: 2.5,
        height: "100%",
        position: "relative",
        overflow: "hidden",
        "&:hover": { boxShadow: "0 16px 34px rgba(16,24,40,0.12)", borderColor: alpha(accent, 0.4) },
      }}
    >
      {/* top accent bar */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accent}, ${alpha(accent, 0.3)})`,
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            color: accent,
            bgcolor: alpha(accent, 0.12),
          }}
        >
          {icon}
        </Box>
      </Stack>

      <Typography
        sx={{
          fontSize: 34,
          fontWeight: 700,
          lineHeight: 1.1,
          mt: 0.5,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
        }}
      >
        <AnimatedNumber value={value} format={format} />
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75, minHeight: 24 }}>
        {delta !== undefined && (
          <Stack
            direction="row"
            spacing={0.25}
            alignItems="center"
            sx={{
              px: 0.75,
              py: 0.25,
              borderRadius: 999,
              bgcolor: alpha(up ? semanticTokens.successMain : semanticTokens.errorMain, 0.12),
              color: up ? semanticTokens.successMain : semanticTokens.errorMain,
              fontSize: 12.5,
              fontWeight: 700,
            }}
          >
            {up ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />}
            {Math.abs(delta)}
            {deltaSuffix}
          </Stack>
        )}
        {footer}
      </Stack>
    </MotionCard>
  );
}
