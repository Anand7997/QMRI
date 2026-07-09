export const typographyTokens = {
  fontFamily:
    "'Segoe UI Variable', 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', Arial, sans-serif",
  h1: { fontSize: "1.375rem", lineHeight: 1.27, fontWeight: 600 }, // 22
  h2: { fontSize: "1.125rem", lineHeight: 1.33, fontWeight: 600 }, // 18
  h3: { fontSize: "1rem", lineHeight: 1.375, fontWeight: 600 }, // 16 card title
  h4: { fontSize: "0.875rem", lineHeight: 1.43, fontWeight: 600 },
  body1: { fontSize: "0.875rem", lineHeight: 1.43 }, // 14
  body2: { fontSize: "0.8125rem", lineHeight: 1.38 }, // 13
  caption: { fontSize: "0.75rem", lineHeight: 1.33 }, // 12
  button: { fontSize: "0.875rem", fontWeight: 600, textTransform: "none" as const },
  overline: {
    fontSize: "0.6875rem",
    lineHeight: 1.45,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
} as const;
