import { useMemo } from "react";
import { Box, Button, Card, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { useAuthContext } from "contexts/AuthContext";
import { EmptyState } from "shared/components";
import { AssessmentStatus, type AssessmentSummaryDto } from "shared/api/types";
import { resolveDueDate } from "features/dashboard/governance/dashboardGovernanceState";
import { defaultReminderPreferences, useReminderPreferences } from "shared/api/dashboardGovernance";

interface DueDateReminderWidgetProps {
  assessments: AssessmentSummaryDto[];
  onOpenAssessment: (assessmentId: string) => void;
}

export function DueDateReminderWidget({ assessments, onOpenAssessment }: DueDateReminderWidgetProps) {
  const { user } = useAuthContext();
  const preferencesQuery = useReminderPreferences(user?.userId);
  const preferences = preferencesQuery.data ?? defaultReminderPreferences();

  const activeRows = useMemo(
    () =>
      assessments
        .filter((assessment) => assessment.status === AssessmentStatus.Draft || assessment.status === AssessmentStatus.InProgress)
        .map((assessment) => {
          const dueAtUtc = resolveDueDate(assessment, preferences.defaultDueInDays);
          const daysLeft = Math.ceil((new Date(dueAtUtc).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return {
            assessment,
            dueAtUtc,
            daysLeft,
            urgency: urgencyFor(daysLeft, preferences.remindBeforeDays),
          };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5),
    [assessments, preferences.defaultDueInDays, preferences.remindBeforeDays],
  );

  return (
    <Card sx={{ p: 2.5, height: "100%" }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <EventAvailableOutlinedIcon color="primary" />
        <Typography variant="h3">Due Dates & Reminders</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Active assignments ranked by due-date urgency.
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Chip
          size="small"
          icon={<NotificationsActiveOutlinedIcon />}
          color={preferences.enabled ? "success" : "default"}
          label={preferences.enabled ? `Reminders ${preferences.remindBeforeDays} days before due` : "Reminders off"}
        />
        <Chip size="small" variant="outlined" label={`${preferences.defaultDueInDays}-day target`} />
      </Stack>

      {activeRows.length === 0 ? (
        <EmptyState title="No active due dates" description="New and in-progress assessments appear here." />
      ) : (
        <Stack spacing={1.25}>
          {activeRows.map(({ assessment, dueAtUtc, daysLeft, urgency }) => (
            <Box key={assessment.assessmentId} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={800} noWrap>
                    {assessment.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Due {formatDate(dueAtUtc)} - {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                  </Typography>
                </Box>
                <Chip size="small" color={urgency.color} label={urgency.label} />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.max(0, assessment.completionPercentage))}
                sx={{ height: 6, borderRadius: 999, mt: 1.25 }}
              />
              <Button size="small" sx={{ mt: 1 }} onClick={() => onOpenAssessment(assessment.assessmentId)}>
                Continue
              </Button>
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
}

function urgencyFor(daysLeft: number, reminderWindow: number): { label: string; color: "success" | "warning" | "error" } {
  if (daysLeft < 0) return { label: "Overdue", color: "error" };
  if (daysLeft <= reminderWindow) return { label: "Due soon", color: "warning" };
  return { label: "On track", color: "success" };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
