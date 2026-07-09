import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Collapse,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ConfirmDialog, EmptyState, FormDrawer, LoadingState, PageHeader } from "shared/components";
import {
  useCategoryMutations,
  useHierarchy,
  useModuleMutations,
  useSubModuleMutations,
} from "shared/api/catalog";
import type { CategoryDto, ModuleDto, SubModuleDto } from "shared/api/types";

type Kind = "category" | "module" | "submodule";
interface Editing {
  kind: Kind;
  mode: "create" | "edit";
  parentId?: string; // categoryId for module, moduleId for submodule
  id?: string;
  code: string;
  name: string;
  description: string;
  weight: number;
  sortOrder: number;
  isActive: boolean;
}

const kindLabel: Record<Kind, string> = { category: "Category", module: "Module", submodule: "SubModule" };

export function StructurePage() {
  const { data: tree = [], isLoading, isError } = useHierarchy(true, false);
  const cat = useCategoryMutations();
  const mod = useModuleMutations();
  const sub = useSubModuleMutations();

  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirm, setConfirm] = useState<{ kind: Kind; id: string; name: string } | null>(null);

  const startCreate = (kind: Kind, parentId?: string) =>
    setEditing({ kind, mode: "create", parentId, code: "", name: "", description: "", weight: 1, sortOrder: 0, isActive: true });

  const startEditCategory = (c: CategoryDto) =>
    setEditing({ kind: "category", mode: "edit", id: c.categoryId, code: c.code, name: c.name, description: c.description ?? "", weight: 1, sortOrder: c.sortOrder, isActive: c.isActive });
  const startEditModule = (m: ModuleDto) =>
    setEditing({ kind: "module", mode: "edit", id: m.moduleId, parentId: m.categoryId, code: m.code, name: m.name, description: m.description ?? "", weight: m.weight, sortOrder: m.sortOrder, isActive: m.isActive });
  const startEditSub = (s: SubModuleDto) =>
    setEditing({ kind: "submodule", mode: "edit", id: s.subModuleId, parentId: s.moduleId, code: s.code, name: s.name, description: s.description ?? "", weight: s.weight, sortOrder: s.sortOrder, isActive: s.isActive });

  const submitting = cat.create.isPending || cat.update.isPending || mod.create.isPending || mod.update.isPending || sub.create.isPending || sub.update.isPending;

  const save = async () => {
    if (!editing) return;
    const { kind, mode, id, parentId, code, name, description, weight, sortOrder, isActive } = editing;
    if (kind === "category") {
      const body = { code, name, description: description || null, sortOrder, isActive };
      mode === "create" ? await cat.create.mutateAsync(body) : await cat.update.mutateAsync({ id: id!, body });
    } else if (kind === "module") {
      const body = { categoryId: parentId!, code, name, description: description || null, weight, sortOrder, isActive };
      mode === "create" ? await mod.create.mutateAsync(body) : await mod.update.mutateAsync({ id: id!, body });
    } else {
      const body = { moduleId: parentId!, code, name, description: description || null, weight, sortOrder, isActive };
      mode === "create" ? await sub.create.mutateAsync(body) : await sub.update.mutateAsync({ id: id!, body });
    }
    setEditing(null);
  };

  const doDelete = async () => {
    if (!confirm) return;
    if (confirm.kind === "category") await cat.remove.mutateAsync(confirm.id);
    else if (confirm.kind === "module") await mod.remove.mutateAsync(confirm.id);
    else await sub.remove.mutateAsync(confirm.id);
  };

  return (
    <Box>
      <PageHeader
        title="Assessment Structure"
        subtitle="Manage Categories, Modules and SubModules. Questions are managed in the Question Bank."
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => startCreate("category")}>New category</Button>}
      />

      {isLoading ? (
        <LoadingState label="Loading structure…" />
      ) : isError ? (
        <EmptyState title="Couldn’t load structure" description="Check the API connection and try again." />
      ) : tree.length === 0 ? (
        <EmptyState title="No categories yet" description="Create your first category to build the hierarchy."
          action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => startCreate("category")}>New category</Button>} />
      ) : (
        <Stack spacing={1.5}>
          {tree.map((c) => (
            <Accordion key={c.categoryId} disableGutters elevation={0}
              sx={{ border: 1, borderColor: "divider", borderRadius: 3, "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexGrow: 1 }}>
                  <Typography variant="h3">{c.name}</Typography>
                  {!c.isActive && <Chip size="small" label="Inactive" />}
                  <Chip size="small" variant="outlined" label={`${c.moduleCount} modules`} />
                  <Chip size="small" variant="outlined" label={`${c.questionCount} questions`} />
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title="Add module"><IconButton size="small" component="span" onClick={(e) => { e.stopPropagation(); startCreate("module", c.categoryId); }}><AddIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Edit category"><IconButton size="small" component="span" onClick={(e) => { e.stopPropagation(); startEditCategory(c); }}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete category"><IconButton size="small" component="span" sx={{ color: "error.main" }} onClick={(e) => { e.stopPropagation(); setConfirm({ kind: "category", id: c.categoryId, name: c.name }); }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Stack spacing={0.5}>
                  {c.modules.map((m) => {
                    const open = openModules[m.moduleId];
                    return (
                      <Box key={m.moduleId} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1 }}>
                          <IconButton size="small" onClick={() => setOpenModules((s) => ({ ...s, [m.moduleId]: !open }))}>
                            {open ? <ExpandMoreIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                          </IconButton>
                          <Typography variant="body1" fontWeight={600} sx={{ flexGrow: 1 }}>{m.name}</Typography>
                          {!m.isActive && <Chip size="small" label="Inactive" />}
                          <Chip size="small" variant="outlined" label={`${m.subModuleCount} sub`} />
                          <Chip size="small" variant="outlined" label={`${m.questionCount} Q`} />
                          <Tooltip title="Add submodule"><IconButton size="small" onClick={() => startCreate("submodule", m.moduleId)}><AddIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Edit module"><IconButton size="small" onClick={() => startEditModule(m)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete module"><IconButton size="small" sx={{ color: "error.main" }} onClick={() => setConfirm({ kind: "module", id: m.moduleId, name: m.name })}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                        </Stack>
                        <Collapse in={open}>
                          <Stack sx={{ pl: 5, pr: 1.5, pb: 1 }}>
                            {m.subModules.map((s) => (
                              <Stack key={s.subModuleId} direction="row" alignItems="center" spacing={1}
                                sx={{ py: 0.75, borderTop: 1, borderColor: "divider" }}>
                                <Typography variant="body2" sx={{ flexGrow: 1 }}>{s.name}</Typography>
                                {!s.isActive && <Chip size="small" label="Inactive" />}
                                <Chip size="small" variant="outlined" label={`${s.questionCount} Q`} />
                                <IconButton size="small" onClick={() => startEditSub(s)}><EditOutlinedIcon fontSize="small" /></IconButton>
                                <IconButton size="small" sx={{ color: "error.main" }} onClick={() => setConfirm({ kind: "submodule", id: s.subModuleId, name: s.name })}><DeleteOutlineIcon fontSize="small" /></IconButton>
                              </Stack>
                            ))}
                            {m.subModules.length === 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ py: 1 }}>No submodules.</Typography>
                            )}
                          </Stack>
                        </Collapse>
                      </Box>
                    );
                  })}
                  {c.modules.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ py: 1 }}>No modules.</Typography>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      <FormDrawer
        open={Boolean(editing)}
        title={editing ? `${editing.mode === "create" ? "New" : "Edit"} ${kindLabel[editing.kind]}` : ""}
        submitting={submitting}
        onClose={() => setEditing(null)}
        onSubmit={save}
      >
        {editing && (
          <Stack spacing={2}>
            <TextField label="Code" required value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
            <TextField label="Name" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <TextField label="Description" multiline minRows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <Stack direction="row" spacing={2}>
              {editing.kind !== "category" && (
                <TextField label="Weight" type="number" inputProps={{ step: 0.5, min: 0 }} sx={{ flex: 1 }}
                  value={editing.weight} onChange={(e) => setEditing({ ...editing, weight: Number(e.target.value) })} />
              )}
              <TextField label="Sort order" type="number" sx={{ flex: 1 }}
                value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
            </Stack>
            <FormControlLabel control={<Switch checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />} label="Active" />
          </Stack>
        )}
      </FormDrawer>

      <ConfirmDialog
        open={Boolean(confirm)}
        destructive
        title={confirm ? `Delete ${kindLabel[confirm.kind].toLowerCase()}?` : ""}
        message={confirm ? <>Permanently removes “{confirm.name}” and its children.</> : ""}
        confirmLabel="Delete"
        onConfirm={doDelete}
        onClose={() => setConfirm(null)}
      />
    </Box>
  );
}
