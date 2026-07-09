import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  IconButton,
  LinearProgress,
  Menu,
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
import AddIcon from "@mui/icons-material/Add";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ConfirmDialog,
  EmptyState,
  FormDrawer,
  MaturityChip,
  PageHeader,
  StatusChip,
  TableSkeleton,
  type EntityStatus,
} from "shared/components";
import {
  useAssessments,
  useCreateAssessment,
  useDeleteAssessment,
  useUpdateAssessment,
} from "shared/api/assessments";
import { AssessmentStatus, type AssessmentSummaryDto } from "shared/api/types";
import { RoutePaths } from "shared/constants/routePaths";

const statusByValue: Record<number, EntityStatus> = {
  [AssessmentStatus.Draft]: "Draft",
  [AssessmentStatus.InProgress]: "InProgress",
  [AssessmentStatus.Submitted]: "Submitted",
  [AssessmentStatus.Scored]: "Scored",
  [AssessmentStatus.Archived]: "Archived",
};

function statusFor(value: number): EntityStatus {
  return statusByValue[value] ?? "Draft";
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function defaultTitle() {
  return `TOPP QA Maturity Assessment - ${formatDate(new Date().toISOString())}`;
}

function progressLabel(row: AssessmentSummaryDto) {
  return `${row.answeredCount}/${row.questionCount} answered`;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

export function AssessmentListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const assessmentsQuery = useAssessments();
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeRow, setActiveRow] = useState<AssessmentSummaryDto | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      openCreate();
      navigate(RoutePaths.assessments, { replace: true });
    }
  }, [location.state, navigate]);

  const rows = useMemo(() => assessmentsQuery.data ?? [], [assessmentsQuery.data]);
  const isSubmitting = createAssessment.isPending || updateAssessment.isPending;

  function openCreate() {
    setEditingId(null);
    setTitle(defaultTitle());
    setDescription("");
    setFormError(null);
    setActionError(null);
    setDrawerOpen(true);
  }

  function openEdit(row: AssessmentSummaryDto) {
    setEditingId(row.assessmentId);
    setTitle(row.title);
    setDescription(row.description ?? "");
    setFormError(null);
    setActionError(null);
    setMenuAnchor(null);
    setDrawerOpen(true);
  }

  async function save() {
    const body = {
      title: title.trim() || null,
      description: description.trim() || null,
    };

    setFormError(null);
    setActionError(null);

    try {
      if (editingId) {
        await updateAssessment.mutateAsync({ id: editingId, body });
      } else {
        await createAssessment.mutateAsync(body);
      }

      setDrawerOpen(false);
    } catch (error) {
      setFormError(errorMessage(error, editingId ? "Could not update assessment." : "Could not create assessment."));
    }
  }

  async function deleteActiveAssessment() {
    if (!activeRow) return;

    setActionError(null);

    try {
      await deleteAssessment.mutateAsync(activeRow.assessmentId);
      setActiveRow(null);
    } catch (error) {
      setActionError(errorMessage(error, "Could not delete assessment."));
    }
  }

  return (
    <Box>
      <PageHeader
        title="Assessments"
        subtitle="Create, edit, monitor and remove TOPP QA maturity assessments."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New assessment
          </Button>
        }
      />

      <Card>
        {actionError && (
          <Alert severity="error" sx={{ m: 2, mb: 0 }}>
            {actionError}
          </Alert>
        )}

        {assessmentsQuery.isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : assessmentsQuery.isError ? (
          <EmptyState
            title="Could not load assessments"
            description="Check that the backend is running and try again."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<AssignmentOutlinedIcon sx={{ fontSize: 40 }} />}
            title="No assessments yet"
            description="Create the first assessment to start tracking TOPP QA maturity."
            action={
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                New assessment
              </Button>
            }
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Assessment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.assessmentId} hover>
                    <TableCell sx={{ minWidth: 260 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {row.title}
                      </Typography>
                      {row.description && (
                        <Typography variant="caption" color="text.secondary">
                          {row.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={statusFor(row.status)} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Stack spacing={0.75}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, Math.max(0, row.completionPercentage))}
                          sx={{ height: 8, borderRadius: 999 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {progressLabel(row)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {row.overallScore == null ? (
                        <Typography variant="body2" color="text.secondary">
                          Not scored
                        </Typography>
                      ) : (
                        <MaturityChip score={row.overallScore} />
                      )}
                    </TableCell>
                    <TableCell>{formatDate(row.createdAtUtc)}</TableCell>
                    <TableCell>{formatDate(row.submittedAtUtc)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        aria-label="Assessment actions"
                        onClick={(event) => {
                          setMenuAnchor(event.currentTarget);
                          setActiveRow(row);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => activeRow && openEdit(activeRow)}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            setMenuAnchor(null);
            setConfirmOpen(true);
          }}
        >
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <FormDrawer
        open={drawerOpen}
        title={editingId ? "Edit assessment" : "New assessment"}
        submitLabel={editingId ? "Update" : "Create"}
        submitting={isSubmitting}
        onClose={() => setDrawerOpen(false)}
        onSubmit={save}
      >
        <Stack spacing={2}>
          <TextField
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            multiline
            minRows={3}
          />
          {formError && (
            <Typography variant="body2" color="error.main">
              {formError}
            </Typography>
          )}
        </Stack>
      </FormDrawer>

      <ConfirmDialog
        open={confirmOpen}
        destructive
        title="Delete assessment?"
        message={
          activeRow
            ? `This permanently deletes ${activeRow.title} and all saved responses, scores and recommendations.`
            : "This permanently deletes the selected assessment."
        }
        confirmLabel="Delete"
        onConfirm={() => {
          void deleteActiveAssessment();
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </Box>
  );
}