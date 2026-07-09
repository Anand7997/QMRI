import { Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { answerColor, maturityFor, type AnswerOption } from "shared/domain/maturity";
import { semanticTokens, neutralTokens } from "app/theme/tokens/palette";

function toneChip(label: string, color: string) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        bgcolor: alpha(color, 0.12),
        color,
        fontWeight: 600,
        border: `1px solid ${alpha(color, 0.28)}`,
      }}
    />
  );
}

export type EntityStatus =
  | "Active"
  | "Inactive"
  | "Draft"
  | "InProgress"
  | "Submitted"
  | "Scored"
  | "Archived";

const statusColor: Record<EntityStatus, string> = {
  Active: semanticTokens.successMain,
  Scored: semanticTokens.successMain,
  Submitted: semanticTokens.infoMain,
  InProgress: semanticTokens.warningMain,
  Draft: neutralTokens.ink500,
  Inactive: neutralTokens.ink400,
  Archived: neutralTokens.ink400,
};

const statusLabel: Record<EntityStatus, string> = {
  Active: "Active",
  Inactive: "Inactive",
  Draft: "Draft",
  InProgress: "In progress",
  Submitted: "Submitted",
  Scored: "Scored",
  Archived: "Archived",
};

export function StatusChip({ status }: { status: EntityStatus }) {
  return toneChip(statusLabel[status], statusColor[status]);
}

export function AnswerChip({ answer }: { answer: AnswerOption }) {
  return toneChip(answer, answerColor[answer]);
}

export function MaturityChip({ score }: { score: number }) {
  const m = maturityFor(score);
  return toneChip(`${m.band} · ${Math.round(score)}`, m.color);
}
