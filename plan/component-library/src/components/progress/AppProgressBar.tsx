import { Box, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";
import type { CircularProgressProps, LinearProgressProps } from "@mui/material";

export interface AppProgressBarProps {
  value?: number;
  variant?: "linear" | "circular";
  label?: string;
  showValueLabel?: boolean;
  color?: LinearProgressProps["color"];
  size?: number;
  thickness?: CircularProgressProps["thickness"];
}

export function AppProgressBar({
  value,
  variant = "linear",
  label,
  showValueLabel = true,
  color = "primary",
  size = 72,
  thickness = 4,
}: AppProgressBarProps) {
  const normalized = Math.max(0, Math.min(value ?? 0, 100));

  if (variant === "circular") {
    return (
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box position="relative" display="inline-flex">
          <CircularProgress variant="determinate" value={normalized} size={size} thickness={thickness} />
          {showValueLabel ? (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="grid"
              sx={{ placeItems: "center" }}
            >
              <Typography variant="caption" color="text.secondary">
                {`${Math.round(normalized)}%`}
              </Typography>
            </Box>
          ) : null}
        </Box>
        {label ? <Typography variant="body2">{label}</Typography> : null}
      </Stack>
    );
  }

  return (
    <Stack spacing={0.75}>
      {(label || showValueLabel) && (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2">{label}</Typography>
          {showValueLabel ? (
            <Typography variant="caption" color="text.secondary">
              {`${Math.round(normalized)}%`}
            </Typography>
          ) : null}
        </Stack>
      )}
      <LinearProgress color={color} variant="determinate" value={normalized} />
    </Stack>
  );
}
