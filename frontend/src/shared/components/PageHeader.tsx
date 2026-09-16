import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  titleLeading?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, titleLeading }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={1.5}
      sx={{ mb: 3 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={{ xs: 1.25, sm: 1.75 }} alignItems="center" sx={{ minWidth: 0 }}>
          {titleLeading}
          <Typography variant="h1" sx={{ minWidth: 0 }}>{title}</Typography>
        </Stack>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Stack direction="row" spacing={1}>{actions}</Stack>}
    </Stack>
  );
}
