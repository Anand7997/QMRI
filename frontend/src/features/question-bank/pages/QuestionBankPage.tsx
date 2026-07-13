import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  ConfirmDialog,
  EmptyState,
  FormDrawer,
  PageHeader,
  StatusChip,
  TableSkeleton,
} from "shared/components";
import { useHierarchy, useQuestionMutations, useQuestions } from "shared/api/catalog";
import { AnswerOption, answerLabel, type QuestionDto, type UpsertQuestionRequest } from "shared/api/types";
import { appendGovernanceAuditEntry } from "features/dashboard/governance/dashboardGovernanceState";

const blankForm: UpsertQuestionRequest & { subCategoryId?: string; subModuleId: string } = {
  subModuleId: "",
  text: "",
  guidance: "",
  expectedAnswer: AnswerOption.No,
  weight: 1,
  sortOrder: 0,
  isActive: true,
};

export function QuestionBankPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [subModuleId, setSubModuleId] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const { data: tree = [] } = useHierarchy(true, false);
  const questionsQuery = useQuestions({
    search: search || undefined,
    categoryId: categoryId || undefined,
    moduleId: moduleId || undefined,
    subModuleId: subModuleId || undefined,
    includeInactive: true,
    page: page + 1,
    pageSize,
  });
  const { create, update, remove } = useQuestionMutations();

  const modules = useMemo(
    () => tree.find((c) => c.categoryId === categoryId)?.modules ?? [],
    [tree, categoryId],
  );
  const subModules = useMemo(
    () => modules.find((m) => m.moduleId === moduleId)?.subModules ?? [],
    [modules, moduleId],
  );

  // Drawer form (own cascading selects)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm);
  const [formCat, setFormCat] = useState("");
  const [formMod, setFormMod] = useState("");
  const formModules = useMemo(() => tree.find((c) => c.categoryId === formCat)?.modules ?? [], [tree, formCat]);
  const formSubs = useMemo(
    () => formModules.find((m) => m.moduleId === formMod)?.subModules ?? [],
    [formModules, formMod],
  );

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeRow, setActiveRow] = useState<QuestionDto | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm);
    setFormCat("");
    setFormMod("");
    setDrawerOpen(true);
  };
  const openEdit = (q: QuestionDto) => {
    setEditingId(q.questionId);
    setForm({ subModuleId: q.subModuleId, text: q.text, guidance: q.guidance ?? "", expectedAnswer: q.expectedAnswer, weight: q.weight, sortOrder: q.sortOrder, isActive: q.isActive });
    setFormCat(q.categoryId);
    setFormMod(q.moduleId);
    setDrawerOpen(true);
    setMenuAnchor(null);
  };
  const save = async () => {
    const body: UpsertQuestionRequest = {
      subModuleId: form.subModuleId,
      text: form.text,
      guidance: form.guidance || null,
      expectedAnswer: form.expectedAnswer,
      weight: Number(form.weight),
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    };
    if (editingId) {
      await update.mutateAsync({ id: editingId, body });
      appendGovernanceAuditEntry({
        actor: "Admin",
        action: "Updated question",
        entityType: "Question",
        entityName: body.text.slice(0, 80),
        details: `SubModule ${body.subModuleId}; active=${body.isActive}`,
      });
    } else {
      await create.mutateAsync(body);
      appendGovernanceAuditEntry({
        actor: "Admin",
        action: "Created question",
        entityType: "Question",
        entityName: body.text.slice(0, 80),
        details: `SubModule ${body.subModuleId}; weight=${body.weight}`,
      });
    }
    setDrawerOpen(false);
  };
  const doDelete = async () => {
    if (activeRow) {
      await remove.mutateAsync(activeRow.questionId);
      appendGovernanceAuditEntry({
        actor: "Admin",
        action: "Deleted question",
        entityType: "Question",
        entityName: activeRow.text.slice(0, 80),
        details: `${activeRow.categoryName} / ${activeRow.moduleName} / ${activeRow.subModuleName}`,
      });
    }
  };

  const total = questionsQuery.data?.totalCount ?? 0;
  const items = questionsQuery.data?.items ?? [];

  const resetPage = () => setPage(0);

  return (
    <Box>
      <PageHeader
        title="Question Bank"
        subtitle="Manage assessment questions across categories, modules and submodules."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New question
          </Button>
        }
      />

      <Card>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <TextField
            size="small"
            placeholder="Search questions"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            sx={{ flexGrow: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
          <TextField select size="small" label="Category" value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setModuleId(""); setSubModuleId(""); resetPage(); }} sx={{ minWidth: 180 }}>
            <MenuItem value="">All categories</MenuItem>
            {tree.map((c) => <MenuItem key={c.categoryId} value={c.categoryId}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Module" value={moduleId} disabled={!categoryId}
            onChange={(e) => { setModuleId(e.target.value); setSubModuleId(""); resetPage(); }} sx={{ minWidth: 180 }}>
            <MenuItem value="">All modules</MenuItem>
            {modules.map((m) => <MenuItem key={m.moduleId} value={m.moduleId}>{m.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="SubModule" value={subModuleId} disabled={!moduleId}
            onChange={(e) => { setSubModuleId(e.target.value); resetPage(); }} sx={{ minWidth: 180 }}>
            <MenuItem value="">All submodules</MenuItem>
            {subModules.map((s) => <MenuItem key={s.subModuleId} value={s.subModuleId}>{s.name}</MenuItem>)}
          </TextField>
        </Stack>

        {questionsQuery.isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : questionsQuery.isError ? (
          <EmptyState title="Couldnâ€™t load questions" description="Check the API connection and try again." />
        ) : items.length === 0 ? (
          <EmptyState icon={<HelpOutlineIcon sx={{ fontSize: 40 }} />} title="No questions found"
            description="Adjust filters or add a new question."
            action={<Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>New question</Button>} />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Question</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Module</TableCell>
                    <TableCell>SubModule</TableCell>
                    <TableCell>Answers</TableCell>
                    <TableCell align="right">Weight</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((q) => (
                    <TableRow key={q.questionId} hover>
                      <TableCell sx={{ maxWidth: 420, fontWeight: 500 }}>{q.text}</TableCell>
                      <TableCell>{q.categoryName}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{q.moduleName}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{q.subModuleName}</TableCell>
                      <TableCell>{answerLabel[q.expectedAnswer]}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>{q.weight.toFixed(1)}</TableCell>
                      <TableCell><StatusChip status={q.isActive ? "Active" : "Inactive"} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" aria-label="Row actions"
                          onClick={(e) => { setMenuAnchor(e.currentTarget); setActiveRow(q); }}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={total} page={page}
              onPageChange={(_, p) => setPage(p)} rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); resetPage(); }}
              rowsPerPageOptions={[25, 50, 100]} />
          </>
        )}
      </Card>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => activeRow && openEdit(activeRow)}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem sx={{ color: "error.main" }} onClick={() => { setMenuAnchor(null); setConfirmOpen(true); }}>
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <FormDrawer
        open={drawerOpen}
        title={editingId ? "Edit question" : "New question"}
        submitting={create.isPending || update.isPending}
        onClose={() => setDrawerOpen(false)}
        onSubmit={save}
      >
        <Stack spacing={2}>
          <TextField label="Question text" required multiline minRows={3}
            value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          <TextField label="Guidance" multiline minRows={2}
            value={form.guidance ?? ""} onChange={(e) => setForm({ ...form, guidance: e.target.value })} />
          <TextField select label="Answers" required value={form.expectedAnswer}
            onChange={(e) => setForm({ ...form, expectedAnswer: Number(e.target.value) as UpsertQuestionRequest["expectedAnswer"] })}>
            <MenuItem value={AnswerOption.Yes}>Yes</MenuItem>
            <MenuItem value={AnswerOption.Partial}>Partial</MenuItem>
            <MenuItem value={AnswerOption.No}>No</MenuItem>
          </TextField>
          <TextField select label="Category" value={formCat}
            onChange={(e) => { setFormCat(e.target.value); setFormMod(""); setForm({ ...form, subModuleId: "" }); }}>
            {tree.map((c) => <MenuItem key={c.categoryId} value={c.categoryId}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select label="Module" value={formMod} disabled={!formCat}
            onChange={(e) => { setFormMod(e.target.value); setForm({ ...form, subModuleId: "" }); }}>
            {formModules.map((m) => <MenuItem key={m.moduleId} value={m.moduleId}>{m.name}</MenuItem>)}
          </TextField>
          <TextField select label="SubModule" required value={form.subModuleId} disabled={!formMod}
            onChange={(e) => setForm({ ...form, subModuleId: e.target.value })}>
            {formSubs.map((s) => <MenuItem key={s.subModuleId} value={s.subModuleId}>{s.name}</MenuItem>)}
          </TextField>
          <Stack direction="row" spacing={2}>
            <TextField label="Weight" type="number" inputProps={{ step: 0.5, min: 0 }} sx={{ flex: 1 }}
              value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />
            <TextField label="Sort order" type="number" sx={{ flex: 1 }}
              value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </Stack>
          <FormControlLabel control={<Switch checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Active" />
        </Stack>
      </FormDrawer>

      <ConfirmDialog open={confirmOpen} destructive title="Delete question?"
        message={<>Permanently removes â€œ{activeRow?.text.slice(0, 60)}â€¦â€.</>}
        confirmLabel="Delete" onConfirm={doDelete} onClose={() => setConfirmOpen(false)} />
    </Box>
  );
}
