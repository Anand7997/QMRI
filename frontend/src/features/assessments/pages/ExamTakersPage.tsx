import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Card,
  Chip,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import { EmptyState, LoadingState, PageHeader } from "shared/components";
import { useAssessments, useExamTakers } from "shared/api/assessments";
import type { AssessmentSummaryDto, ExamTakerProgressStatus } from "shared/api/types";
import { collapseAssessmentsByAssignment } from "shared/domain/assessmentGrouping";

const unknownAssignedByValue = "__unknown_assigned_by__";

function assignedByLabel(assessment: AssessmentSummaryDto) {
  return assessment.assignedByFullName?.trim() || assessment.assignedByUserName?.trim() || "Unknown";
}

export function ExamTakersPage() {
  const assessmentsQuery = useAssessments();
  const assessments = useMemo(
    () => collapseAssessmentsByAssignment(assessmentsQuery.data ?? []),
    [assessmentsQuery.data],
  );

  const [assignedByFilter, setAssignedByFilter] = useState<string>("all");
  const [assessmentId, setAssessmentId] = useState<string | undefined>();

  const assignedByOptions = useMemo(() => {
    const options = new Map<string, { label: string; count: number }>();

    assessments.forEach((assessment) => {
      if (assessment.assignedByUserId) {
        const existing = options.get(assessment.assignedByUserId);
        options.set(assessment.assignedByUserId, {
          label: assignedByLabel(assessment),
          count: (existing?.count ?? 0) + 1,
        });
        return;
      }

      const existing = options.get(unknownAssignedByValue);
      options.set(unknownAssignedByValue, {
        label: "Unknown",
        count: (existing?.count ?? 0) + 1,
      });
    });

    return Array.from(options.entries())
      .map(([value, option]) => ({ value, ...option }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [assessments]);

  const filteredAssessments = useMemo(() => {
    if (assignedByFilter === "all") {
      return assessments;
    }

    if (assignedByFilter === unknownAssignedByValue) {
      return assessments.filter((assessment) => !assessment.assignedByUserId);
    }

    return assessments.filter((assessment) => assessment.assignedByUserId === assignedByFilter);
  }, [assignedByFilter, assessments]);

  useEffect(() => {
    if (assignedByFilter === "all") {
      return;
    }

    if (!assignedByOptions.some((option) => option.value === assignedByFilter)) {
      setAssignedByFilter("all");
    }
  }, [assignedByFilter, assignedByOptions]);

  useEffect(() => {
    if (!filteredAssessments.length) {
      setAssessmentId(undefined);
      return;
    }

    if (!assessmentId || !filteredAssessments.some((assessment) => assessment.assessmentId === assessmentId)) {
      setAssessmentId(filteredAssessments[0].assessmentId);
    }
  }, [assessmentId, filteredAssessments]);

  const selectedAssessment = useMemo(
    () => filteredAssessments.find((assessment) => assessment.assessmentId === assessmentId),
    [assessmentId, filteredAssessments],
  );

  const examTakersQuery = useExamTakers(assessmentId);
  const examTakers = examTakersQuery.data ?? [];

  const notStartedCount = examTakers.filter((item) => item.progressStatus === "NotStarted").length;
  const inProgressCount = examTakers.filter((item) => item.progressStatus === "InProgress").length;
  const finishedCount = examTakers.filter((item) => item.progressStatus === "Finished").length;

  return (
    <Box>
      <PageHeader
        title="Exam Takers"
        subtitle="Track who has not started, who is in progress, and who has finished each assigned assessment."
      />

      {assessmentsQuery.isLoading ? <LoadingState label="Loading assessments..." /> : null}

      {assessmentsQuery.isError ? (
        <Card sx={{ p: 4 }}>
          <EmptyState
            title="Could not load assessments"
            description="Please refresh and try again."
          />
        </Card>
      ) : null}

      {!assessmentsQuery.isLoading && !assessmentsQuery.isError && assessments.length === 0 ? (
        <Card sx={{ p: 4 }}>
          <EmptyState
            title="No assessments found"
            description="Create an assessment first to view exam taker progress."
          />
        </Card>
      ) : null}

      {!assessmentsQuery.isLoading && !assessmentsQuery.isError && assessments.length > 0 && filteredAssessments.length === 0 ? (
        <Card sx={{ p: 4 }}>
          <EmptyState
            title="No assessments match this admin"
            description="Change the Assigned by filter to view other assignments."
          />
        </Card>
      ) : null}

      {!assessmentsQuery.isLoading && !assessmentsQuery.isError && filteredAssessments.length > 0 ? (
        <Stack spacing={2}>
          <Card sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  label="Assigned by"
                  value={assignedByFilter}
                  onChange={(event) => setAssignedByFilter(event.target.value)}
                  size="small"
                  sx={{ minWidth: 260 }}
                >
                  <MenuItem value="all">All admins ({assessments.length})</MenuItem>
                  {assignedByOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label} ({option.count})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Assessment"
                  value={assessmentId ?? ""}
                  onChange={(event) => setAssessmentId(event.target.value)}
                  size="small"
                  sx={{ maxWidth: 560, flexGrow: 1 }}
                >
                  {filteredAssessments.map((assessment) => (
                    <MenuItem key={assessment.assessmentId} value={assessment.assessmentId}>
                      {assessment.title} • {formatDate(assessment.createdAtUtc)}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              {selectedAssessment ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={`Assigned by ${assignedByLabel(selectedAssessment)}`} variant="outlined" />
                  {selectedAssessment.departments.map((department) => (
                    <Chip key={department} size="small" label={department} variant="outlined" />
                  ))}
                </Stack>
              ) : null}
            </Stack>
          </Card>

          {examTakersQuery.isLoading ? <LinearProgress /> : null}

          {examTakersQuery.isError ? (
            <Alert severity="error">Could not load exam taker progress for this assessment.</Alert>
          ) : null}

          {!examTakersQuery.isLoading && !examTakersQuery.isError ? (
            <>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                }}
              >
                <StatusMetric
                  label="Not Started"
                  value={notStartedCount}
                  icon={<FlagOutlinedIcon fontSize="small" />}
                  color="warning.main"
                />
                <StatusMetric
                  label="In Progress"
                  value={inProgressCount}
                  icon={<AutorenewOutlinedIcon fontSize="small" />}
                  color="info.main"
                />
                <StatusMetric
                  label="Finished"
                  value={finishedCount}
                  icon={<DoneAllOutlinedIcon fontSize="small" />}
                  color="success.main"
                />
              </Box>

              <Card>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Exam taker</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Started</TableCell>
                        <TableCell>Finished</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {examTakers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <EmptyState
                              icon={<GroupOutlinedIcon sx={{ fontSize: 32 }} />}
                              title="No exam takers found"
                              description="No users were resolved for this assessment selection."
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        examTakers.map((examTaker) => (
                          <TableRow key={examTaker.assessmentId} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700}>
                                {examTaker.fullName || examTaker.userName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {examTaker.userName}
                              </Typography>
                            </TableCell>
                            <TableCell>{examTaker.department || "-"}</TableCell>
                            <TableCell>
                              <ProgressStatusChip status={examTaker.progressStatus} />
                            </TableCell>
                            <TableCell>
                              {examTaker.answeredCount}/{examTaker.questionCount} ({Math.round(examTaker.completionPercentage)}%)
                            </TableCell>
                            <TableCell>{formatDate(examTaker.startedAtUtc)}</TableCell>
                            <TableCell>{formatDate(examTaker.finishedAtUtc)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}

function StatusMetric({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
}) {
  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Stack>
      <Typography variant="h2" sx={{ mt: 0.5 }}>{value}</Typography>
    </Card>
  );
}

function ProgressStatusChip({ status }: { status: ExamTakerProgressStatus }) {
  if (status === "InProgress") {
    return <Chip size="small" color="info" label="In progress" />;
  }

  if (status === "Finished") {
    return <Chip size="small" color="success" label="Finished" />;
  }

  return <Chip size="small" color="warning" label="Not started" />;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
