import { useMemo, useState } from "react";
import { Box, Button, Card, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AssessmentStatus, assessmentStatusLabel, type AssessmentDetailDto, type AssessmentSummaryDto } from "shared/api/types";
import { useAppendGovernanceAuditEntry } from "shared/api/dashboardGovernance";

interface ExportCenterProps {
  title: string;
  scope: "Admin" | "User";
  assessments: AssessmentSummaryDto[];
  details?: AssessmentDetailDto[];
  actor?: string;
  onPdfExport?: () => void;
  isPdfExporting?: boolean;
}

type ExportFormat = "pdf";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: String(AssessmentStatus.Draft), label: "Draft" },
  { value: String(AssessmentStatus.InProgress), label: "In Progress" },
  { value: String(AssessmentStatus.Submitted), label: "Submitted" },
  { value: String(AssessmentStatus.Scored), label: "Scored" },
  { value: String(AssessmentStatus.Archived), label: "Archived" },
] as const;

export function ExportCenter({
  title,
  scope,
  assessments,
  details = [],
  actor = "System",
  onPdfExport,
  isPdfExporting = false,
}: ExportCenterProps) {
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const appendAuditEntry = useAppendGovernanceAuditEntry();

  const rows = useMemo(() => {
    return assessments
      .filter((assessment) => status === "all" || String(assessment.status) === status)
      .filter((assessment) => isAfterOrSame(resolveDate(assessment), fromDate))
      .filter((assessment) => isBeforeOrSame(resolveDate(assessment), toDate))
      .sort((a, b) => new Date(resolveDate(b)).getTime() - new Date(resolveDate(a)).getTime())
      .map((assessment) => ({
        title: assessment.title,
        status: assessmentStatusLabel[assessment.status] ?? "Unknown",
        departments: assessment.departments.join(", ") || "-",
        progress: `${assessment.answeredCount}/${assessment.questionCount}`,
        completion: `${Math.round(assessment.completionPercentage)}%`,
        score: assessment.overallScore == null ? "Pending" : Math.round(assessment.overallScore).toString(),
        assignedBy: assessment.assignedByFullName || assessment.assignedByUserName || "-",
        date: formatDate(resolveDate(assessment)),
      }));
  }, [assessments, fromDate, status, toDate]);

  const recommendationRows = useMemo(
    () =>
      details.flatMap((detail) =>
        detail.recommendations.map((recommendation) => ({
          assessment: detail.summary.title,
          title: recommendation.title,
          category: recommendation.categoryName ?? recommendation.moduleName ?? "Assessment",
          priority: recommendation.priority,
          created: formatDate(recommendation.createdAtUtc),
        })),
      ),
    [details],
  );

  function exportData(format: ExportFormat) {
    if (format === "pdf") {
      if (onPdfExport) {
        onPdfExport();
      } else {
        exportPdf(title, scope, rows, recommendationRows);
      }
    }

    void appendAuditEntry.mutateAsync({
      actor,
      action: `Exported ${format.toUpperCase()} report`,
      entityType: "Export",
      entityName: title,
      details: `${rows.length} assessments; status=${status}; from=${fromDate || "any"}; to=${toDate || "any"}`,
    }).catch(() => undefined);
  }

  return (
    <Card sx={{ p: 2.5, "@media print": { display: "none" } }}>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems={{ lg: "center" }} justifyContent="space-between">
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <DownloadOutlinedIcon color="primary" />
            <Typography variant="h3">{title}</Typography>
            <Chip size="small" label={`${rows.length} rows`} variant="outlined" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Export branded assessment data with status and date filters.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
          <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 160 }}>
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField size="small" type="date" label="From" value={fromDate} onChange={(event) => setFromDate(event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label="To" value={toDate} onChange={(event) => setToDate(event.target.value)} InputLabelProps={{ shrink: true }} />
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          startIcon={<PictureAsPdfOutlinedIcon />}
          disabled={rows.length === 0 || isPdfExporting}
          onClick={() => exportData("pdf")}
        >
          {isPdfExporting ? "Preparing PDF..." : "PDF"}
        </Button>
      </Stack>
    </Card>
  );
}

function exportPdf(
  title: string,
  scope: string,
  rows: Record<string, string>[],
  recommendationRows: Record<string, string | number>[],
) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18);
  doc.text("TestScan", 14, 16);
  doc.setFontSize(11);
  doc.text(`${title} - ${scope} export - ${formatDate(new Date().toISOString())}`, 14, 24);
  autoTable(doc, {
    startY: 32,
    head: [["Assessment", "Status", "Departments", "Progress", "Completion", "Score", "Assigned by", "Date"]],
    body: rows.map((row) => [row.title, row.status, row.departments, row.progress, row.completion, row.score, row.assignedBy, row.date]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [29, 78, 216] },
  });

  if (recommendationRows.length) {
    autoTable(doc, {
      head: [["Assessment", "Recommendation", "Category", "Priority", "Created"]],
      body: recommendationRows.map((row) => [row.assessment, row.title, row.category, String(row.priority), row.created]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110] },
    });
  }

  doc.save(`${slug(title)}.pdf`);
}

function resolveDate(assessment: AssessmentSummaryDto) {
  return assessment.scoredAtUtc ?? assessment.submittedAtUtc ?? assessment.startedAtUtc ?? assessment.createdAtUtc;
}

function isAfterOrSame(value: string, minDate: string) {
  if (!minDate) return true;
  return new Date(value).getTime() >= new Date(`${minDate}T00:00:00`).getTime();
}

function isBeforeOrSame(value: string, maxDate: string) {
  if (!maxDate) return true;
  return new Date(value).getTime() <= new Date(`${maxDate}T23:59:59`).getTime();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "testscan-export";
}
