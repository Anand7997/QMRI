import { dataTokens } from "app/theme/tokens/palette";

export type MaturityBand = "Testing" | "QA" | "QE" | "IQ";

export interface MaturityInfo {
  band: MaturityBand;
  color: string;
  min: number;
  max: number;
}

const BANDS: MaturityInfo[] = [
  { band: "Testing", color: dataTokens.bandTesting, min: 0, max: 30 },
  { band: "QA", color: dataTokens.bandQA, min: 31, max: 60 },
  { band: "QE", color: dataTokens.bandQE, min: 61, max: 80 },
  { band: "IQ", color: dataTokens.bandIQ, min: 81, max: 100 },
];

export function maturityFor(score: number): MaturityInfo {
  const clamped = Math.max(0, Math.min(100, score));
  return BANDS.find((b) => clamped >= b.min && clamped <= b.max) ?? BANDS[0];
}

export const maturityBands = BANDS;

export type AnswerOption = "No" | "Partial" | "Yes";

export const answerColor: Record<AnswerOption, string> = {
  Yes: dataTokens.answerYes,
  Partial: dataTokens.answerPartial,
  No: dataTokens.answerNo,
};
