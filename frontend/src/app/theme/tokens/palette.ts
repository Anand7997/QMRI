// Light "White + Azure Blue" design-system palette (Fluent-inspired).
export const brandTokens = {
  blue700: "#0B5CAD",
  blue600: "#0F6CBD",
  blue500: "#2B88D8",
  blue300: "#8AC0F0",
  blue100: "#EAF3FC",
  blue50: "#F5F9FE",
} as const;

export const neutralTokens = {
  ink900: "#1B1B1F",
  ink700: "#323238",
  ink500: "#616167",
  ink400: "#8A8A90",
  line300: "#E1E1E4",
  line200: "#EDEDF0",
  surface0: "#FFFFFF",
  surface1: "#F7F8FA",
  surface2: "#F0F2F5",
} as const;

export const semanticTokens = {
  successMain: "#0E700E",
  successSurface: "#E9F6EC",
  warningMain: "#8A5A00",
  warningSurface: "#FBF2E2",
  errorMain: "#B10E1C",
  errorSurface: "#FCECEC",
  infoMain: "#0F6CBD",
  infoSurface: "#EAF3FC",
} as const;

// Maturity bands + answer tones (domain data-viz).
export const dataTokens = {
  bandTesting: "#C23934",
  bandQA: "#D9822B",
  bandQE: "#2B88D8",
  bandIQ: "#0E8A6A",
  answerYes: "#0E700E",
  answerPartial: "#8A5A00",
  answerNo: "#B10E1C",
} as const;

export const paletteTokens = {
  primary: { main: brandTokens.blue600 },
  secondary: { main: brandTokens.blue300 },
  background: { default: neutralTokens.surface1, paper: neutralTokens.surface0 },
} as const;
