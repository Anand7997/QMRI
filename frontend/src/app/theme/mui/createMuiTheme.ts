import { createTheme } from "@mui/material/styles";
import {
  brandTokens,
  neutralTokens,
  semanticTokens,
} from "app/theme/tokens/palette";
import { typographyTokens } from "app/theme/tokens/typography";
import { radiusTokens, shadowTokens } from "app/theme/tokens/spacing";

const base = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brandTokens.blue600,
      dark: brandTokens.blue700,
      light: brandTokens.blue500,
      contrastText: "#FFFFFF",
    },
    secondary: { main: brandTokens.blue300 },
    success: { main: semanticTokens.successMain },
    warning: { main: semanticTokens.warningMain },
    error: { main: semanticTokens.errorMain },
    info: { main: semanticTokens.infoMain },
    background: {
      default: neutralTokens.surface1,
      paper: neutralTokens.surface0,
    },
    text: {
      primary: neutralTokens.ink900,
      secondary: neutralTokens.ink500,
      disabled: neutralTokens.ink400,
    },
    divider: neutralTokens.line300,
    action: {
      hover: brandTokens.blue50,
      selected: brandTokens.blue100,
    },
  },
  shape: { borderRadius: radiusTokens.md },
  typography: {
    fontFamily: typographyTokens.fontFamily,
    h1: typographyTokens.h1,
    h2: typographyTokens.h2,
    h3: typographyTokens.h3,
    h4: typographyTokens.h4,
    body1: typographyTokens.body1,
    body2: typographyTokens.body2,
    caption: typographyTokens.caption,
    button: typographyTokens.button,
    overline: typographyTokens.overline,
  },
});

export const appTheme = createTheme(base, {
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: neutralTokens.surface1 },
        "*::-webkit-scrollbar": { width: 10, height: 10 },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: neutralTokens.line300,
          borderRadius: 999,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: radiusTokens.lg,
          border: `1px solid ${neutralTokens.line300}`,
          boxShadow: shadowTokens.resting,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radiusTokens.md,
          textTransform: "none",
          fontWeight: 600,
          paddingInline: 16,
          minHeight: 36,
        },
        containedPrimary: {
          "&:hover": { backgroundColor: brandTokens.blue500 },
          "&:active": { backgroundColor: brandTokens.blue700 },
        },
        outlined: {
          borderColor: neutralTokens.line300,
          color: neutralTokens.ink700,
          "&:hover": {
            borderColor: neutralTokens.ink400,
            backgroundColor: neutralTokens.surface1,
          },
        },
        text: { color: neutralTokens.ink700 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: radiusTokens.md },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radiusTokens.md,
          backgroundColor: neutralTokens.surface0,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: neutralTokens.line300 },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: neutralTokens.ink400 },
        },
        input: { padding: "9px 12px" },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: 14, color: neutralTokens.ink700 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radiusTokens.pill, fontWeight: 600, fontSize: 12 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backgroundColor: neutralTokens.surface0,
          borderBottom: `1px solid ${neutralTokens.line300}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: neutralTokens.surface0,
          borderColor: neutralTokens.line300,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radiusTokens.lg,
          boxShadow: shadowTokens.overlay,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: radiusTokens.md,
          border: `1px solid ${neutralTokens.line300}`,
          boxShadow: shadowTokens.raised,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { backgroundColor: neutralTokens.surface1 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: neutralTokens.line200,
          fontSize: 14,
          paddingBlock: 10,
        },
        head: {
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          color: neutralTokens.ink500,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&:hover": { backgroundColor: brandTokens.blue50 } },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: neutralTokens.ink900,
          fontSize: 12,
          borderRadius: radiusTokens.sm,
          padding: "6px 10px",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, minHeight: 44 },
      },
    },
  },
});
