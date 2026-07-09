import { Box, Typography } from "@mui/material";
import { motion } from "motion/react";
import { brandTokens, neutralTokens } from "app/theme/tokens/palette";
import { AnimatedNumber } from "./dashboardMotion";

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
}

export function ProgressRing({
  value,
  size = 104,
  stroke = 9,
  color = brandTokens.blue600,
  track = neutralTokens.surface2,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          <AnimatedNumber value={clamped} format={(n) => `${Math.round(n)}%`} />
        </Typography>
        <Typography variant="caption" color="text.secondary">
          complete
        </Typography>
      </Box>
    </Box>
  );
}
