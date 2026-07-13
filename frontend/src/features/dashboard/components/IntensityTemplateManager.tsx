import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import { useAuthContext } from "contexts/AuthContext";
import {
  appendGovernanceAuditEntry,
  loadIntensityTemplateSettings,
  saveIntensityTemplateSettings,
  type IntensityTemplate,
  type IntensityTemplateSettings,
} from "features/dashboard/governance/dashboardGovernanceState";

interface IntensityTemplateManagerProps {
  onTemplatesChanged?: (settings: IntensityTemplateSettings) => void;
}

export function IntensityTemplateManager({ onTemplatesChanged }: IntensityTemplateManagerProps) {
  const { user } = useAuthContext();
  const [settings, setSettings] = useState<IntensityTemplateSettings>(() => loadIntensityTemplateSettings());
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  const invalidTemplate = useMemo(
    () => settings.templates.find((template) => template.minQuestions > template.maxQuestions),
    [settings.templates],
  );

  function updateTemplate(code: IntensityTemplate["code"], patch: Partial<IntensityTemplate>) {
    setSettings((current) => ({
      ...current,
      templates: current.templates.map((template) =>
        template.code === code
          ? {
              ...template,
              ...patch,
            }
          : template,
      ),
    }));
  }

  function save() {
    if (invalidTemplate) {
      setFeedback({
        severity: "error",
        message: `${invalidTemplate.label}: minimum question count cannot exceed maximum.`,
      });
      return;
    }

    saveIntensityTemplateSettings(settings);
    onTemplatesChanged?.(settings);

    appendGovernanceAuditEntry({
      actor: user?.fullName || user?.userName || "Admin",
      action: "Updated intensity templates",
      entityType: "Intensity Template",
      entityName: "Operational/Strategic/Tactical",
      details: settings.templates
        .map((template) => `${template.code} ${template.minQuestions}-${template.maxQuestions}`)
        .join("; "),
    });

    setFeedback({ severity: "success", message: "Intensity templates saved." });
  }

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <GridViewOutlinedIcon color="primary" />
        <Typography variant="h3">Intensity Template Manager</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage reusable Operational, Strategic and Tactical templates with locked question-count ranges.
      </Typography>

      {feedback ? (
        <Alert severity={feedback.severity} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      ) : null}

      <Stack spacing={1.5}>
        {settings.templates.map((template) => (
          <Card key={template.code} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="subtitle2">{template.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {template.description}
                  </Typography>
                </Box>
                <TextField
                  label="Minimum questions"
                  type="number"
                  value={template.minQuestions}
                  onChange={(event) =>
                    updateTemplate(template.code, {
                      minQuestions: Number(event.target.value),
                    })
                  }
                  disabled={template.lockedRange}
                  sx={{ maxWidth: 180 }}
                />
                <TextField
                  label="Maximum questions"
                  type="number"
                  value={template.maxQuestions}
                  onChange={(event) =>
                    updateTemplate(template.code, {
                      maxQuestions: Number(event.target.value),
                    })
                  }
                  disabled={template.lockedRange}
                  sx={{ maxWidth: 180 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={template.lockedRange}
                      onChange={(event) =>
                        updateTemplate(template.code, {
                          lockedRange: event.target.checked,
                        })
                      }
                    />
                  }
                  label="Lock range"
                />
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }}>
        <TextField
          select
          label="Default template"
          value={settings.defaultTemplateCode}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              defaultTemplateCode: event.target.value as IntensityTemplate["code"],
            }))
          }
          sx={{ minWidth: 220 }}
        >
          {settings.templates.map((template) => (
            <MenuItem key={template.code} value={template.code}>
              {template.label}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={save}>
          Save intensity templates
        </Button>
      </Stack>
    </Card>
  );
}
