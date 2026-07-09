import { Box, CircularProgress, Skeleton, Stack, Typography } from "@mui/material";

export interface LoaderProps {
  variant?: "spinner" | "skeleton";
  message?: string;
  rows?: number;
  minHeight?: number;
}

export function Loader({
  variant = "spinner",
  message = "Loading...",
  rows = 4,
  minHeight = 160,
}: LoaderProps) {
  if (variant === "skeleton") {
    return (
      <Stack spacing={1.2}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={`skeleton-row-${index}`} variant="rounded" height={42} />
        ))}
      </Stack>
    );
  }

  return (
    <Box
      minHeight={minHeight}
      display="grid"
      sx={{ placeItems: "center" }}
      textAlign="center"
      gap={1}
    >
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
