import { useMemo, type ReactNode } from "react";
import { Alert, Box, Card, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import PublishedWithChangesOutlinedIcon from "@mui/icons-material/PublishedWithChangesOutlined";
import type { AssessmentSummaryDto } from "shared/api/types";
import { AssessmentStatus } from "shared/api/types";
import { useUsers } from "shared/api/users";

interface DeliveryReadinessPanelProps {
  assessments: AssessmentSummaryDto[];
  exportEnabled: boolean;
}

export function DeliveryReadinessPanel({ assessments, exportEnabled }: DeliveryReadinessPanelProps) {
  const usersQuery = useUsers("Pending");
  const pendingApprovals = usersQuery.data ?? [];

  const summary = useMemo(() => {
    const pendingApprovalsCount = pendingApprovals.length;
    const pendingApprovalBreaches = pendingApprovals.filter((user) => daysSince(user.requestedAtUtc) > 2).length;

    const unscoredSubmissions = assessments.filter(
      (assessment) =>
        assessment.status === AssessmentStatus.Submitted ||
        (assessment.status === AssessmentStatus.Scored && assessment.overallScore == null),
    );

    const unscoredBreaches = unscoredSubmissions.filter((assessment) =>
      daysSince(assessment.submittedAtUtc ?? assessment.createdAtUtc) > 1,
    ).length;

    const inProgressBreachCount = assessments.filter(
      (assessment) =>
        (assessment.status === AssessmentStatus.Draft || assessment.status === AssessmentStatus.InProgress) &&
        daysSince(assessment.startedAtUtc ?? assessment.createdAtUtc) > 14,
    ).length;

    const slaBreaches = pendingApprovalBreaches + unscoredBreaches + inProgressBreachCount;

    const securityChecks = [
      { label: "JWT authentication", healthy: true },
      { label: "Route role guards", healthy: true },
      { label: "Inactivity timeout", healthy: false },
      { label: "Protected admin APIs", healthy: false },
    ];

    const healthySecurityChecks = securityChecks.filter((check) => check.healthy).length;
    const securityReady = healthySecurityChecks === securityChecks.length;

    const readinessScore = Math.round(
      Math.max(
        0,
        100 -
          slaBreaches * 8 -
          (securityChecks.length - healthySecurityChecks) * 12 -
          (exportEnabled ? 0 : 10),
      ),
    );

    return {
      pendingApprovalsCount,
      unscoredSubmissionCount: unscoredSubmissions.length,
      slaBreaches,
      securityReady,
      healthySecurityChecks,
      securityCheckCount: securityChecks.length,
      securityChecks,
      readinessScore,
    };
  }, [assessments, exportEnabled, pendingApprovals]);

  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h3" sx={{ mb: 0.5 }}>
        Delivery Readiness Panel
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Security status, export capability, pending approvals, unscored submissions and SLA breaches.
      </Typography>

      {usersQuery.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
      {usersQuery.isError ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Pending-approval metrics are currently unavailable.
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
        }}
      >
        <ReadinessMetric
          icon={<ShieldOutlinedIcon fontSize="small" />}
          label="Security status"
          value={summary.securityReady ? "Ready" : "Attention"}
          tone={summary.securityReady ? "success" : "warning"}
          helper={`${summary.healthySecurityChecks}/${summary.securityCheckCount} controls healthy`}
        />
        <ReadinessMetric
          icon={<PublishedWithChangesOutlinedIcon fontSize="small" />}
          label="Export status"
          value={exportEnabled ? "Ready" : "Pending"}
          tone={exportEnabled ? "success" : "warning"}
          helper={exportEnabled ? "PDF / Excel / CSV enabled" : "Enable export center"}
        />
        <ReadinessMetric
          icon={<PendingActionsOutlinedIcon fontSize="small" />}
          label="Pending approvals"
          value={summary.pendingApprovalsCount.toString()}
          tone={summary.pendingApprovalsCount === 0 ? "success" : "warning"}
          helper="Access requests awaiting admin action"
        />
        <ReadinessMetric
          icon={<WarningAmberOutlinedIcon fontSize="small" />}
          label="SLA breaches"
          value={summary.slaBreaches.toString()}
          tone={summary.slaBreaches === 0 ? "success" : "error"}
          helper={`${summary.unscoredSubmissionCount} unscored submissions`}
        />
      </Box>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ mt: 2 }}>
        <Card variant="outlined" sx={{ p: 1.5, flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="subtitle2">Readiness score</Typography>
            <Chip
              size="small"
              color={summary.readinessScore >= 85 ? "success" : summary.readinessScore >= 65 ? "warning" : "error"}
              label={`${summary.readinessScore}%`}
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={summary.readinessScore}
            color={summary.readinessScore >= 85 ? "success" : summary.readinessScore >= 65 ? "warning" : "error"}
            sx={{ height: 8, borderRadius: 999 }}
          />
        </Card>

        <Card variant="outlined" sx={{ p: 1.5, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
            Security control checks
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {summary.securityChecks.map((check) => (
              <Chip
                key={check.label}
                size="small"
                label={check.label}
                color={check.healthy ? "success" : "warning"}
                variant={check.healthy ? "filled" : "outlined"}
              />
            ))}
          </Stack>
        </Card>
      </Stack>
    </Card>
  );
}

function ReadinessMetric({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: "success" | "warning" | "error";
}) {
  const textColor = tone === "success" ? "success.main" : tone === "warning" ? "warning.main" : "error.main";

  return (
    <Card variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ color: textColor }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography variant="h3" sx={{ mt: 0.5, color: textColor }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {helper}
      </Typography>
    </Card>
  );
}

function daysSince(value?: string | null) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}
