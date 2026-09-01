import { Box, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

interface QmriLogoProps {
  label?: string;
  to?: string;
  size?: "sm" | "md" | "lg";
  light?: boolean;
  showText?: boolean;
  sx?: SxProps<Theme>;
}

const sizeMap = {
  sm: { width: 148, height: 39 },
  md: { width: 184, height: 49 },
  lg: { width: 244, height: 64 },
};

export function QmriLogo({ label = "Everforth Quinnox", to, size = "md", light = false, showText = false, sx }: QmriLogoProps) {
  const imageSize = sizeMap[size];
  const rootSx: SxProps<Theme> = [
    {
      width: "fit-content",
      minWidth: 0,
      textDecoration: "none",
      color: "inherit",
      cursor: to ? "pointer" : "default",
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  const content = (
    <>
      <Box
        component="img"
        src="/everforth-quinnox-logo.svg"
        alt="Everforth Quinnox logo"
        sx={{
          width: imageSize.width,
          height: imageSize.height,
          objectFit: "contain",
          display: "block",
          flex: "0 0 auto",
          borderRadius: 0,
        }}
      />
      {showText ? (
        <Typography
          variant={size === "lg" ? "h2" : "h6"}
          noWrap
          sx={{
            fontWeight: 800,
            color: light ? "#fff" : "text.primary",
            letterSpacing: 0,
          }}
        >
          {label}
        </Typography>
      ) : null}
    </>
  );

  if (to) {
    return (
      <Stack component={RouterLink} to={to} direction="row" spacing={1.25} alignItems="center" sx={rootSx}>
        {content}
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={rootSx}>
      {content}
    </Stack>
  );
}

