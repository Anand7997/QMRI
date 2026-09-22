import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import { useAuthContext } from "contexts/AuthContext";
import { AssessmentStatus, type AssessmentSummaryDto } from "shared/api/types";
import {
  isAssessmentExpired,
  resolveDueDate,
} from "features/dashboard/governance/dashboardGovernanceState";
import { defaultReminderPreferences, useReminderPreferences } from "shared/api/dashboardGovernance";

interface DueDateReminderWidgetProps {
  assessments: AssessmentSummaryDto[];
  onOpenAssessment: (assessmentId: string) => void;
}

export function DueDateReminderWidget({ assessments, onOpenAssessment }: DueDateReminderWidgetProps) {
  const { user } = useAuthContext();
  const preferencesQuery = useReminderPreferences(user?.userId);
  const preferences = preferencesQuery.data ?? defaultReminderPreferences();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const reminderRows = useMemo(
    () =>
      assessments
        .filter((assessment) => assessment.status === AssessmentStatus.Draft || assessment.status === AssessmentStatus.InProgress)
        .map((assessment) => {
          const dueAtUtc = resolveDueDate(assessment);
          const daysLeft = Math.ceil((new Date(dueAtUtc).getTime() - now) / (1000 * 60 * 60 * 24));
          const expired = isAssessmentExpired(assessment, now);
          return {
            assessment,
            dueAtUtc,
            daysLeft,
            expired,
            urgency: expired ? { label: "Expired", color: "error" as const } : urgencyFor(daysLeft, preferences.remindBeforeDays),
          };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [assessments, now, preferences.remindBeforeDays],
  );

  if (reminderRows.length === 0) {
    return null;
  }

  return (
    <Card
      sx={{
        p: 2.5,
        height: "100%",
        maxHeight: { xs: 520, lg: 340 },
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <EventAvailableOutlinedIcon color="primary" />
        <Typography variant="h3">Due Dates & Reminders</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Assignments are ranked by due-date urgency.
      </Typography>

      <Box
        role="region"
        aria-label="Assessment due dates"
        sx={{ minHeight: 0, flex: 1, overflowY: "auto", pr: 0.5, mr: -0.5 }}
      >
        <Stack spacing={1.25}>
          {reminderRows.map(({ assessment, dueAtUtc, daysLeft, expired, urgency }) => (
            <Box key={assessment.assessmentId} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={800} noWrap>
                    {assessment.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {expired
                      ? `Expired ${formatDate(dueAtUtc)}`
                      : `Due ${formatDate(dueAtUtc)} - ${daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}`}
                  </Typography>
                </Box>
                <Chip size="small" color={urgency.color} label={urgency.label} />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.max(0, assessment.completionPercentage))}
                sx={{ height: 6, borderRadius: 999, mt: 1.25, opacity: expired ? 0.55 : 1 }}
              />
              {!expired ? (
                <Button size="small" sx={{ mt: 1 }} onClick={() => onOpenAssessment(assessment.assessmentId)}>
                  {assessment.status === AssessmentStatus.Draft ? "Start assessment" : "Continue assessment"}
                </Button>
              ) : null}
            </Box>
          ))}
        </Stack>
      </Box>
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
