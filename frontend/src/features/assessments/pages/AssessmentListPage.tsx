import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Collapse,
  Divider,
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
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
import { useHierarchy } from "shared/api/catalog";
import { useUsers } from "shared/api/users";
import {
  AssessmentStatus,
  QuestionIntensity,
  type AssessmentSummaryDto,
  type CategoryDto,
  type ModuleDto,
  type SubModuleDto,
} from "shared/api/types";
import { RoutePaths } from "shared/constants/routePaths";
import { collapseAssessmentsByAssignment } from "shared/domain/assessmentGrouping";
import {
  appendGovernanceAuditEntry,
  findIntensityTemplate,
  loadIntensityTemplateSettings,
  type IntensityTemplate,
} from "features/dashboard/governance/dashboardGovernanceState";

const departmentOptions = ["Fresher", "Digital", "Ai", "QE", "Delevery"] as const;
const unknownAssignedByValue = "__unknown_assigned_by__";

const recommendedQuestionCountByTemplate: Record<IntensityTemplate["code"], number> = {
  Operational: 40,
  Tactical: 80,
  Strategic: 100,
};

const templateIntensityByCode: Record<IntensityTemplate["code"], number> = {
  Operational: QuestionIntensity.Operational,
  Tactical: QuestionIntensity.Tactical,
  Strategic: QuestionIntensity.Strategic,
};

const importanceKeywordsByTemplate: Record<IntensityTemplate["code"], readonly string[]> = {
  Operational: [
    "ci/cd",
    "automation",
    "environment",
    "test data",
    "customer",
    "defect",
    "quality",
    "coverage",
    "release",
    "production",
    "shift-left",
    "collaboration",
    "compliance",
    "risk",
    "dashboard",
    "integration",
  ],
  Tactical: [
    "regression",
    "coverage",
    "automation",
    "framework",
    "traceability",
    "defect",
    "api",
    "performance",
    "security",
    "environment",
    "data",
    "pipeline",
    "execution",
    "monitoring",
    "reporting",
    "triage",
  ],
  Strategic: [
    "strategy",
    "governance",
    "enterprise",
    "leadership",
    "business",
    "portfolio",
    "roadmap",
    "operating model",
    "transformation",
    "standard",
    "kpi",
    "innovation",
    "scalability",
    "investment",
    "alignment",
    "target",
  ],
};

interface TemplateQuestionCandidate {
  questionId: string;
  categoryId: string;
  categoryName: string;
  moduleName: string;
  subModuleName: string;
  text: string;
  guidance?: string | null;
  intensity: number;
  weight: number;
  sortOrder: number;
}

function flattenTemplateQuestions(categories: CategoryDto[]): TemplateQuestionCandidate[] {
  return categories.flatMap((category) =>
    category.modules.flatMap((module) =>
      module.subModules.flatMap((subModule) =>
        subModule.questions.map((question) => ({
          questionId: question.questionId,
          categoryId: category.categoryId,
          categoryName: category.name,
          moduleName: module.name,
          subModuleName: subModule.name,
          text: question.text,
          guidance: question.guidance,
          intensity: question.intensity,
          weight: question.weight,
          sortOrder: question.sortOrder,
        })),
      ),
    ),
  );
}

function scoreQuestionImportance(question: TemplateQuestionCandidate, templateCode: IntensityTemplate["code"]) {
  const haystack = [
    question.categoryName,
    question.moduleName,
    question.subModuleName,
    question.text,
    question.guidance ?? "",
  ]
    .join(" ")
    .toLowerCase();

  let score = Math.round(question.weight * 10) + Math.max(0, 20 - question.sortOrder);
  const targetIntensity = templateIntensityByCode[templateCode];

  if (question.intensity == targetIntensity) {
    score += 220;
  } else if (templateCode === "Operational" && question.intensity === QuestionIntensity.Tactical) {
    score += 110;
  } else if (templateCode === "Operational" && question.intensity === QuestionIntensity.Strategic) {
    score += 70;
  }

  for (const keyword of importanceKeywordsByTemplate[templateCode]) {
    if (haystack.includes(keyword)) {
      score += 28;
    }
  }

  if (haystack.includes("mandatory")) {
    score += 40;
  }

  return score;
}

function pickBalancedQuestionIds(
  candidates: TemplateQuestionCandidate[],
  templateCode: IntensityTemplate["code"],
  targetCount: number,
  excluded = new Set<string>(),
) {
  const grouped = new Map<string, Array<TemplateQuestionCandidate & { score: number }>>();

  candidates.forEach((question) => {
    if (excluded.has(question.questionId)) {
      return;
    }

    const scoredQuestion = {
      ...question,
      score: scoreQuestionImportance(question, templateCode),
    };
    const lane = grouped.get(question.categoryId) ?? [];
    lane.push(scoredQuestion);
    grouped.set(question.categoryId, lane);
  });

  const lanes = Array.from(grouped.values())
    .map((lane) =>
      lane.sort(
        (left, right) =>
          right.score - left.score ||
          left.sortOrder - right.sortOrder ||
          right.weight - left.weight ||
          left.text.localeCompare(right.text),
      ),
    )
    .sort((left, right) => (left[0]?.categoryName ?? "").localeCompare(right[0]?.categoryName ?? ""));

  const selected: string[] = [];

  while (selected.length < targetCount) {
    let progressed = false;

    for (const lane of lanes) {
      const next = lane.shift();
      if (!next || excluded.has(next.questionId)) {
        continue;
      }

      excluded.add(next.questionId);
      selected.push(next.questionId);
      progressed = true;

      if (selected.length === targetCount) {
        break;
      }
    }

    if (!progressed) {
      break;
    }
  }

  return selected;
}

function buildRecommendedQuestionIds(categories: CategoryDto[], templateCode: IntensityTemplate["code"]) {
  const targetCount = recommendedQuestionCountByTemplate[templateCode];
  const allQuestions = flattenTemplateQuestions(categories);
  const selected = new Set<string>();
  const questionIds: string[] = [];
  const targetIntensity = templateIntensityByCode[templateCode];

  questionIds.push(
    ...pickBalancedQuestionIds(
      allQuestions.filter((question) => question.intensity === targetIntensity),
      templateCode,
      targetCount,
      selected,
    ),
  );

  if (questionIds.length < targetCount) {
    questionIds.push(
      ...pickBalancedQuestionIds(
        allQuestions.filter((question) => question.intensity !== targetIntensity),
        templateCode,
        targetCount - questionIds.length,
        selected,
      ),
    );
  }

  return questionIds;
}

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
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function assignedByLabel(row: AssessmentSummaryDto) {
  return row.assignedByFullName?.trim() || row.assignedByUserName?.trim() || "Unknown";
}

export function AssessmentListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const assessmentsQuery = useAssessments();
  const catalogQuery = useHierarchy(false, true);
  const approvedUsersQuery = useUsers("Approved");
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<IntensityTemplate["code"]>(() => loadIntensityTemplateSettings().defaultTemplateCode);
  const [shouldSeedRecommendedQuestions, setShouldSeedRecommendedQuestions] = useState(false);
  const [departmentAnchor, setDepartmentAnchor] = useState<HTMLElement | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);
  const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeRow, setActiveRow] = useState<AssessmentSummaryDto | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [assignedByFilter, setAssignedByFilter] = useState<string>("all");

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      openCreate();
      navigate(RoutePaths.assessments, { replace: true });
    }
  }, [location.state, navigate]);

  const rows = useMemo(() => collapseAssessmentsByAssignment(assessmentsQuery.data ?? []), [assessmentsQuery.data]);
  const assignedByOptions = useMemo(() => {
    const options = new Map<string, { label: string; count: number }>();

    rows.forEach((row) => {
      if (row.assignedByUserId) {
        const existing = options.get(row.assignedByUserId);
        options.set(row.assignedByUserId, {
          label: assignedByLabel(row),
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
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (assignedByFilter === "all") {
      return rows;
    }

    if (assignedByFilter === unknownAssignedByValue) {
      return rows.filter((row) => !row.assignedByUserId);
    }

    return rows.filter((row) => row.assignedByUserId === assignedByFilter);
  }, [assignedByFilter, rows]);

  const catalog = catalogQuery.data ?? [];
  const scopedCatalog = catalog;
  const selectedQuestionSet = useMemo(() => new Set(selectedQuestionIds), [selectedQuestionIds]);
  const expandedCategorySet = useMemo(() => new Set(expandedCategoryIds), [expandedCategoryIds]);
  const expandedModuleSet = useMemo(() => new Set(expandedModuleIds), [expandedModuleIds]);
  const isSubmitting = createAssessment.isPending || updateAssessment.isPending;
  const eligibleUserCountByDepartment = useMemo(() => {
    const counts = new Map<string, number>();
    (approvedUsersQuery.data ?? [])
      .filter((user) => user.isActive)
      .forEach((user) => counts.set(user.category, (counts.get(user.category) ?? 0) + 1));
    return counts;
  }, [approvedUsersQuery.data]);
  const recommendedQuestionCount = recommendedQuestionCountByTemplate[selectedTemplateCode];


  useEffect(() => {
    if (assignedByFilter === "all") {
      return;
    }

    if (!assignedByOptions.some((option) => option.value === assignedByFilter)) {
      setAssignedByFilter("all");
    }
  }, [assignedByFilter, assignedByOptions]);

  useEffect(() => {
    if (!shouldSeedRecommendedQuestions || !drawerOpen || Boolean(editingId) || !catalog.length) {
      return;
    }

    setSelectedQuestionIds(buildRecommendedQuestionIds(catalog, selectedTemplateCode));
    setShouldSeedRecommendedQuestions(false);
  }, [catalog, drawerOpen, editingId, selectedTemplateCode, shouldSeedRecommendedQuestions]);

  function openCreate() {
    const defaultTemplateCode = loadIntensityTemplateSettings().defaultTemplateCode;

    setEditingId(null);
    setTitle(defaultTitle());
    setDescription("");
    setSelectedDepartments([]);
    setSelectedTemplateCode(defaultTemplateCode);
    setSelectedQuestionIds(buildRecommendedQuestionIds(catalog, defaultTemplateCode));
    setShouldSeedRecommendedQuestions(!catalog.length);
    setDepartmentAnchor(null);
    setExpandedCategoryIds([]);
    setExpandedModuleIds([]);
    setFormError(null);
    setActionError(null);
    setDrawerOpen(true);
  }

  function openEdit(row: AssessmentSummaryDto) {
    setEditingId(row.assessmentId);
    setTitle(row.title);
    setDescription(row.description ?? "");
    setSelectedDepartments(row.departments ?? []);
    setSelectedQuestionIds(row.questionIds ?? []);
    setShouldSeedRecommendedQuestions(false);
    setDepartmentAnchor(null);
    setExpandedCategoryIds([]);
    setExpandedModuleIds([]);
    setFormError(null);
    setActionError(null);
    setMenuAnchor(null);
    setDrawerOpen(true);
  }

  async function save() {
    const baseBody = {
      title: title.trim() || null,
      description: description.trim() || null,
    };

    setFormError(null);
    setActionError(null);

    if (!editingId) {
      if (selectedDepartments.length === 0) {
        setFormError("Select at least one department.");
        return;
      }

      if (selectedQuestionIds.length === 0) {
        setFormError("Select at least one assessment scope.");
        return;
      }

      const template = findIntensityTemplate(selectedTemplateCode);
      if (selectedQuestionIds.length < recommendedQuestionCount) {
        setFormError(
          `${template?.label ?? selectedTemplateCode} assessments start with ${recommendedQuestionCount} recommended questions. You selected ${selectedQuestionIds.length}. Add more questions or use the recommended selection.`,
        );
        return;
      }
    }

    try {
      if (editingId) {
        await updateAssessment.mutateAsync({ id: editingId, body: baseBody });
      } else {
        await createAssessment.mutateAsync({
          ...baseBody,
          departments: selectedDepartments,
          questionIds: selectedQuestionIds,
        });
        appendGovernanceAuditEntry({
          actor: "Admin",
          action: "Created assessment from intensity template",
          entityType: "Intensity Template",
          entityName: selectedTemplateCode,
          details: `${selectedQuestionIds.length} selected questions`,
        });
      }

      setDrawerOpen(false);
    } catch (error) {
      setFormError(errorMessage(error, editingId ? "Could not update assessment." : "Could not create assessment."));
    }
  }

  function applyRecommendedQuestions(templateCode = selectedTemplateCode) {
    if (!catalog.length) {
      setSelectedQuestionIds([]);
      setShouldSeedRecommendedQuestions(true);
      return;
    }

    setSelectedQuestionIds(buildRecommendedQuestionIds(catalog, templateCode));
    setShouldSeedRecommendedQuestions(false);
  }

  function setQuestions(questionIds: string[], checked: boolean) {
    setShouldSeedRecommendedQuestions(false);
    setSelectedQuestionIds((current) => {
      const next = new Set(current);
      questionIds.forEach((questionId) => {
        if (checked) {
          next.add(questionId);
        } else {
          next.delete(questionId);
        }
      });
      return Array.from(next);
    });
  }

  function toggleDepartment(department: string, checked: boolean) {
    setSelectedDepartments((current) =>
      checked ? Array.from(new Set([...current, department])) : current.filter((item) => item !== department),
    );
  }

  function questionIdsForModule(module: ModuleDto) {
    return module.subModules.flatMap((subModule) => questionIdsForSubModule(subModule));
  }

  function questionIdsForSubModule(subModule: SubModuleDto) {
    return subModule.questions.map((question) => question.questionId);
  }

  function toggleExpandedCategory(categoryId: string) {
    setExpandedCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  }

  function toggleExpandedModule(moduleId: string) {
    setExpandedModuleIds((current) =>
      current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId],
    );
  }

  function checkboxState(questionIds: string[]) {
    const selectedCount = questionIds.filter((questionId) => selectedQuestionSet.has(questionId)).length;
    return {
      checked: questionIds.length > 0 && selectedCount === questionIds.length,
      indeterminate: selectedCount > 0 && selectedCount < questionIds.length,
    };
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

        {rows.length > 0 ? (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ sm: "center" }}
            sx={{ px: 2, pt: 2, pb: 1 }}
          >
            <TextField
              select
              size="small"
              label="Assigned by"
              value={assignedByFilter}
              onChange={(event) => setAssignedByFilter(event.target.value)}
              sx={{ minWidth: 240 }}
            >
              <MenuItem value="all">All admins ({rows.length})</MenuItem>
              {assignedByOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </MenuItem>
              ))}
            </TextField>
            {assignedByFilter !== "all" ? (
              <Button variant="text" onClick={() => setAssignedByFilter("all")}>
                Clear filter
              </Button>
            ) : null}
          </Stack>
        ) : null}

        {assessmentsQuery.isLoading ? (
          <TableSkeleton rows={8} cols={8} />
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
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No assessments match this admin"
            description="Change the Assigned by filter to view other assignments."
            action={
              <Button variant="outlined" onClick={() => setAssignedByFilter("all")}>
                Show all admins
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
                  <TableCell>Assigned by</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.assessmentId} hover>
                    <TableCell sx={{ minWidth: 280 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {row.title}
                      </Typography>
                      {row.description && (
                        <Typography variant="caption" color="text.secondary">
                          {row.description}
                        </Typography>
                      )}
                      {row.departments?.length ? (
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: "wrap" }}>
                          {row.departments.map((department) => (
                            <Chip key={department} size="small" label={department} variant="outlined" />
                          ))}
                        </Stack>
                      ) : null}
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
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {assignedByLabel(row)}
                      </Typography>
                      {row.assignedByUserName ? (
                        <Typography variant="caption" color="text.secondary">
                          {row.assignedByUserName}
                        </Typography>
                      ) : null}
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
          {!editingId && (
            <>
              <Divider />
              <TextField
                select
                label="Intensity template"
                value={selectedTemplateCode}
                onChange={(event) => {
                  const nextTemplateCode = event.target.value as IntensityTemplate["code"];
                  setSelectedTemplateCode(nextTemplateCode);
                  setFormError(null);
                  applyRecommendedQuestions(nextTemplateCode);
                }}
                helperText={`${selectedTemplateCode} starts with ${recommendedQuestionCount} important questions across all categories. Admins can add more questions manually.`}
              >
                {loadIntensityTemplateSettings().templates.map((template) => {
                  const recommendedCount = recommendedQuestionCountByTemplate[template.code];
                  const maxLabel = template.maxQuestions > recommendedCount ? `, up to ${template.maxQuestions}` : "";

                  return (
                    <MenuItem key={template.code} value={template.code}>
                      {template.label} ({recommendedCount} recommended{maxLabel})
                    </MenuItem>
                  );
                })}
              </TextField>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Department</Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ExpandMoreIcon />}
                  onClick={(event) => setDepartmentAnchor(event.currentTarget)}
                  sx={{ justifyContent: "space-between", textTransform: "none" }}
                >
                  {selectedDepartments.length ? `${selectedDepartments.length} selected` : "Select departments"}
                </Button>
                <Menu
                  anchorEl={departmentAnchor}
                  open={Boolean(departmentAnchor)}
                  onClose={() => setDepartmentAnchor(null)}
                  slotProps={{ paper: { sx: { width: departmentAnchor?.clientWidth ?? 260 } } }}
                >
                  {departmentOptions.map((department) => (
                    <MenuItem
                      key={department}
                      dense
                      disabled={(eligibleUserCountByDepartment.get(department) ?? 0) === 0}
                      onClick={() => toggleDepartment(department, !selectedDepartments.includes(department))}
                    >
                      <Checkbox size="small" checked={selectedDepartments.includes(department)} />
                      <Typography variant="body2" sx={{ flex: 1 }}>{department}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(eligibleUserCountByDepartment.get(department) ?? 0) > 0
                          ? `${eligibleUserCountByDepartment.get(department)} eligible`
                          : "No eligible users"}
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
              <Divider />
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, gap: 1, flexWrap: "wrap" }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                    <Typography variant="subtitle2">Assessment scope</Typography>
                    <Chip size="small" label={`${selectedQuestionIds.length} selected`} />
                    <Chip size="small" variant="outlined" label={`${recommendedQuestionCount} recommended`} />
                  </Stack>
                  <Button size="small" onClick={() => applyRecommendedQuestions()} disabled={catalogQuery.isLoading}>
                    Use recommended
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.25 }}>
                  The most important questions are preselected from all categories. You can keep them and add more questions before assignment.
                </Typography>
                {catalogQuery.isLoading ? (
                  <LinearProgress />
                ) : catalogQuery.isError ? (
                  <Typography variant="body2" color="error.main">
                    Could not load assessment scope.
                  </Typography>
                ) : (
                  <Stack
                    spacing={0.25}
                    sx={{
                      maxHeight: 420,
                      overflowY: "auto",
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 1,
                    }}
                  >
                    {scopedCatalog.map((category) => {
                      const categoryQuestionIds = category.modules.flatMap((module) => questionIdsForModule(module));
                      const categoryState = checkboxState(categoryQuestionIds);
                      const categoryExpanded = expandedCategorySet.has(category.categoryId);

                      return (
                        <Box key={category.categoryId}>
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minHeight: 34 }}>
                            <IconButton size="small" onClick={() => toggleExpandedCategory(category.categoryId)}>
                              {categoryExpanded ? <ExpandMoreIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                            </IconButton>
                            <Checkbox
                              size="small"
                              checked={categoryState.checked}
                              indeterminate={categoryState.indeterminate}
                              onChange={(event) => setQuestions(categoryQuestionIds, event.target.checked)}
                            />
                            <FolderOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>
                              {category.name}
                            </Typography>
                          </Stack>
                          <Collapse in={categoryExpanded} timeout="auto" unmountOnExit>
                            <Stack spacing={0.25} sx={{ pl: 3 }}>
                              {category.modules.map((module) => {
                                const moduleQuestionIds = questionIdsForModule(module);
                                const moduleState = checkboxState(moduleQuestionIds);
                                const moduleExpanded = expandedModuleSet.has(module.moduleId);

                                return (
                                  <Box key={module.moduleId}>
                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minHeight: 32 }}>
                                      <IconButton size="small" onClick={() => toggleExpandedModule(module.moduleId)}>
                                        {moduleExpanded ? <ExpandMoreIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                                      </IconButton>
                                      <Checkbox
                                        size="small"
                                        checked={moduleState.checked}
                                        indeterminate={moduleState.indeterminate}
                                        onChange={(event) => setQuestions(moduleQuestionIds, event.target.checked)}
                                      />
                                      <FolderOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                                      <Typography variant="body2" sx={{ flex: 1 }}>
                                        {module.name}
                                      </Typography>
                                    </Stack>
                                    <Collapse in={moduleExpanded} timeout="auto" unmountOnExit>
                                      <Stack spacing={0.25} sx={{ pl: 5 }}>
                                        {module.subModules.map((subModule) => {
                                          const subModuleQuestionIds = questionIdsForSubModule(subModule);
                                          const subModuleState = checkboxState(subModuleQuestionIds);

                                          return (
                                            <Stack
                                              key={subModule.subModuleId}
                                              direction="row"
                                              alignItems="center"
                                              spacing={0.5}
                                              sx={{ minHeight: 30 }}
                                            >
                                              <Box sx={{ width: 28 }} />
                                              <Checkbox
                                                size="small"
                                                checked={subModuleState.checked}
                                                indeterminate={subModuleState.indeterminate}
                                                onChange={(event) => setQuestions(subModuleQuestionIds, event.target.checked)}
                                              />
                                              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                                {subModule.name}
                                              </Typography>
                                            </Stack>
                                          );
                                        })}
                                      </Stack>
                                    </Collapse>
                                  </Box>
                                );
                              })}
                            </Stack>
                          </Collapse>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </>
          )}
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









