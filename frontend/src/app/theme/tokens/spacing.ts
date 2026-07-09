// 4px base, 8px rhythm.
export const spacingTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radiusTokens = {
  sm: 6,
  md: 8, // buttons, inputs
  lg: 12, // cards, dialogs
  pill: 999,
} as const;

// Soft Fluent shadows.
export const shadowTokens = {
  resting: "0 1px 2px rgba(16,24,40,0.06)",
  raised: "0 4px 12px rgba(16,24,40,0.10)",
  overlay: "0 12px 28px rgba(16,24,40,0.16)",
} as const;
