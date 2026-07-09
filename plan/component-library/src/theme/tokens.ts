import { createTheme } from "@mui/material/styles";

export const colorTokens = {
  brand: {
    900: "#12263A",
    700: "#1F3D5C",
    500: "#2E5E8A",
    300: "#8CB4D9",
    100: "#E7F1FB",
  },
  neutral: {
    900: "#111827",
    700: "#374151",
    500: "#6B7280",
    300: "#D1D5DB",
    100: "#F3F4F6",
  },
  success: "#2E7D32",
  warning: "#ED6C02",
  error: "#D32F2F",
  info: "#0288D1",
  background: "#F6F8FB",
  surface: "#FFFFFF",
};

export const spacingTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radiusTokens = {
  sm: 6,
  md: 8,
  lg: 12,
};

export const shadowTokens = {
  sm: "0 1px 2px rgba(16, 24, 40, 0.08)",
  md: "0 4px 10px rgba(16, 24, 40, 0.10)",
  lg: "0 10px 24px rgba(16, 24, 40, 0.14)",
};

export const createQmriTheme = () =>
  createTheme({
    palette: {
      mode: "light",
      primary: {
        main: colorTokens.brand[700],
      },
      secondary: {
        main: colorTokens.brand[300],
      },
      success: {
        main: colorTokens.success,
      },
      warning: {
        main: colorTokens.warning,
      },
      error: {
        main: colorTokens.error,
      },
      info: {
        main: colorTokens.info,
      },
      background: {
        default: colorTokens.background,
        paper: colorTokens.surface,
      },
      text: {
        primary: colorTokens.neutral[900],
        secondary: colorTokens.neutral[700],
      },
    },
    shape: {
      borderRadius: radiusTokens.md,
    },
    typography: {
      fontFamily: "'Segoe UI', 'Verdana', sans-serif",
      h1: { fontSize: "2rem", fontWeight: 700 },
      h2: { fontSize: "1.75rem", fontWeight: 700 },
      h3: { fontSize: "1.5rem", fontWeight: 700 },
      h4: { fontSize: "1.25rem", fontWeight: 600 },
      body1: { fontSize: "1rem", lineHeight: 1.6 },
      body2: { fontSize: "0.875rem", lineHeight: 1.5 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: shadowTokens.sm,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
    },
  });
