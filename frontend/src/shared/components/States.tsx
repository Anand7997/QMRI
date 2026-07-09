import type { ReactNode } from "react";
import { Box, CircularProgress, Skeleton, Stack, Typography } from "@mui/material";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 8, px: 3, textAlign: "center" }}>
      <Box sx={{ color: "text.disabled", display: "flex" }}>
        {icon ?? <InboxOutlinedIcon sx={{ fontSize: 40 }} />}
      </Box>
      <Typography variant="h3">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Stack>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 8 }}>
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <Stack key={r} direction="row" spacing={2} sx={{ py: 1 }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} variant="rounded" height={20} sx={{ flex: c === 0 ? 2 : 1 }} />
          ))}
        </Stack>
      ))}
    </Box>
  );
}
