import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import { useAuthContext } from "contexts/AuthContext";
import {
  appendGovernanceAuditEntry,
  loadScoringPolicySettings,
  saveScoringPolicySettings,
  totalPillarWeight,
  type ScoringPolicySettings,
} from "features/dashboard/governance/dashboardGovernanceState";

const DEFAULT_POLICY = loadScoringPolicySettings();

const bandHints = [
  { key: "low", label: "Needs immediate action", fallback: "< 50" },
  { key: "medium", label: "Needs improvement", fallback: "50 - 75" },
  { key: "high", label: "Strong / maintain", fallback: "> 75" },
] as const;

interface ScoringPolicyManagerProps {
  onPolicyChanged?: (policy: ScoringPolicySettings) => void;
}

export function ScoringPolicyManager({ onPolicyChanged }: ScoringPolicyManagerProps) {
  const { user } = useAuthContext();
  const [policy, setPolicy] = useState<ScoringPolicySettings>(() => loadScoringPolicySettings());
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  const weightTotal = useMemo(() => totalPillarWeight(policy), [policy]);
  const lowMax = policy.recommendationBands.lowMax;
  const mediumMax = policy.recommendationBands.mediumMax;
  const rangesValid = lowMax < mediumMax;
  const canSave = weightTotal === 100 && rangesValid;

  function updateWeight(key: keyof ScoringPolicySettings["pillarWeights"], value: number) {
    setPolicy((current) => ({
      ...current,
      pillarWeights: {
        ...current.pillarWeights,
        [key]: value,
      },
    }));
  }

  function save() {
    if (!canSave) {
      setFeedback({
        severity: "error",
        message: "Weights must total 100 and recommendation bands must be in ascending order.",
      });
      return;
    }

    saveScoringPolicySettings(policy);
    onPolicyChanged?.(policy);
    appendGovernanceAuditEntry({
      actor: user?.fullName || user?.userName || "Admin",
      action: "Updated scoring policy",
      entityType: "Scoring Policy",
      entityName: "Global policy",
      details: `Pass mark ${policy.passMark}; low <= ${policy.recommendationBands.lowMax}; medium <= ${policy.recommendationBands.mediumMax}`,
    });

    setFeedback({ severity: "success", message: "Scoring policy saved." });
  }

  function resetDefaults() {
    setPolicy(DEFAULT_POLICY);
    setFeedback(null);
  }

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <RuleOutlinedIcon color="primary" />
        <Typography variant="h3">Scoring Policy Manager</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure pillar weights, pass mark and recommendation bands used by dashboard reporting.
      </Typography>

      {feedback ? (
        <Alert severity={feedback.severity} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Pillar weights
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              label="Technology"
              type="number"
              value={policy.pillarWeights.technology}
              onChange={(event) => updateWeight("technology", Number(event.target.value))}
            />
            <TextField
              label="Operating Model"
              type="number"
              value={policy.pillarWeights.operatingModel}
              onChange={(event) => updateWeight("operatingModel", Number(event.target.value))}
            />
            <TextField
              label="Process"
              type="number"
              value={policy.pillarWeights.process}
              onChange={(event) => updateWeight("process", Number(event.target.value))}
            />
            <TextField
              label="People"
              type="number"
              value={policy.pillarWeights.people}
              onChange={(event) => updateWeight("people", Number(event.target.value))}
            />
            <Alert severity={weightTotal === 100 ? "success" : "warning"}>
              Total weight: {weightTotal} / 100
            </Alert>
          </Stack>
        </Card>

        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Result and recommendation bands
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              label="Pass mark"
              type="number"
              value={policy.passMark}
              onChange={(event) =>
                setPolicy((current) => ({
                  ...current,
                  passMark: Number(event.target.value),
                }))
              }
              inputProps={{ min: 0, max: 100 }}
              helperText="Used for pass/fail presentation in dashboards."
            />
            <TextField
              label="Low band upper bound"
              type="number"
              value={policy.recommendationBands.lowMax}
              onChange={(event) =>
                setPolicy((current) => ({
                  ...current,
                  recommendationBands: {
                    ...current.recommendationBands,
                    lowMax: Number(event.target.value),
                  },
                }))
              }
              inputProps={{ min: 1, max: 99 }}
            />
            <TextField
              label="Medium band upper bound"
              type="number"
              value={policy.recommendationBands.mediumMax}
              onChange={(event) =>
                setPolicy((current) => ({
                  ...current,
                  recommendationBands: {
                    ...current.recommendationBands,
                    mediumMax: Number(event.target.value),
                  },
                }))
              }
              inputProps={{ min: 1, max: 99 }}
            />
            <TextField
              label="Band preview"
              select
              value="preview"
              InputProps={{ readOnly: true }}
            >
              <MenuItem value="preview">
                {bandHints[0].label}: 0 - {policy.recommendationBands.lowMax}; {bandHints[1].label}: {policy.recommendationBands.lowMax + 1} - {policy.recommendationBands.mediumMax}; {bandHints[2].label}: {policy.recommendationBands.mediumMax + 1} - 100
              </MenuItem>
            </TextField>
            {!rangesValid ? (
              <Alert severity="warning">Low band must end before medium band.</Alert>
            ) : null}
          </Stack>
        </Card>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
        <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={save} disabled={!canSave}>
          Save scoring policy
        </Button>
        <Button variant="outlined" startIcon={<RestartAltOutlinedIcon />} onClick={resetDefaults}>
          Reset defaults
        </Button>
      </Stack>
    </Card>
  );
}
