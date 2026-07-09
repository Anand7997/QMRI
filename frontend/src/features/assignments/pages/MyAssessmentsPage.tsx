import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { alpha } from "@mui/material/styles";
import { EmptyState, LoadingState, PageHeader } from "shared/components";
import { useHierarchy } from "shared/api/catalog";
import {
  useAssessment,
  useAssessments,
  useCreateAssessment,
  useSaveResponse,
  useSubmitAssessment,
} from "shared/api/assessments";
import { AnswerOption, AssessmentStatus, answerLabel } from "shared/api/types";
import { answerColor } from "shared/domain/maturity";

const OPTIONS = [AnswerOption.No, AnswerOption.Partial, AnswerOption.Yes];

export function MyAssessmentsPage() {
  const assessmentsQuery = useAssessments();
  const createAssessment = useCreateAssessment();
  const [assessmentId, setAssessmentId] = useState<string | undefined>();

  // Pick the first non-submitted assessment to resume.
  useEffect(() => {
    if (!assessmentId && assessmentsQuery.data?.length) {
      const active = assessmentsQuery.data.find((a) => a.status <= AssessmentStatus.InProgress) ?? assessmentsQuery.data[0];
      setAssessmentId(active.assessmentId);
    }
  }, [assessmentId, assessmentsQuery.data]);

  const detail = useAssessment(assessmentId);
  const treeQuery = useHierarchy(false, true); // active only, with questions
  const saveResponse = useSaveResponse(assessmentId ?? "");
  const submit = useSubmitAssessment(assessmentId ?? "");

  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});

  const tree = treeQuery.data ?? [];

  // Map questionId -> answer (from server responses)
  const answersByQuestion = useMemo(() => {
    const map = new Map<string, number>();
    detail.data?.responses.forEach((r) => map.set(r.questionId, r.answer));
    return map;
  }, [detail.data]);

  const summary = detail.data?.summary;
  const percent = Math.round(summary?.completionPercentage ?? 0);

  // Flatten submodules for lookup
  const currentSub = useMemo(() => {
    for (const c of tree) for (const m of c.modules) {
      const s = m.subModules.find((x) => x.subModuleId === selectedSub);
      if (s) return { category: c.name, module: m.name, sub: s };
    }
    return null;
  }, [tree, selectedSub]);

  // default select first submodule
  useEffect(() => {
    if (!selectedSub && tree.length) {
      const firstMod = tree[0].modules[0];
      if (firstMod?.subModules[0]) {
        setSelectedSub(firstMod.subModules[0].subModuleId);
        setOpenModules({ [firstMod.moduleId]: true });
      }
    }
  }, [selectedSub, tree]);

  const answeredInSub = (questions: { questionId: string }[]) =>
    questions.filter((q) => answersByQuestion.has(q.questionId)).length;

  const answer = (questionId: string, value: number) => {
    if (!assessmentId) return;
    saveResponse.mutate({ questionId, answer: value, findings: notes[questionId] || null });
  };
  const saveNote = (questionId: string) => {
    if (!assessmentId || !answersByQuestion.has(questionId)) return;
    saveResponse.mutate({ questionId, answer: answersByQuestion.get(questionId)!, findings: notes[questionId] || null });
  };

  if (assessmentsQuery.isLoading) return <LoadingState label="Loading your assessments…" />;

  if (!assessmentId && !assessmentsQuery.data?.length) {
    return (
      <Box>
        <PageHeader title="My Assessments" subtitle="Start your TOPP QA maturity assessment." />
        <Card sx={{ p: 4 }}>
          <EmptyState
            title="No assessment yet"
            description="Create an assessment to begin answering questions."
            action={
              <Button variant="contained" disabled={createAssessment.isPending}
                onClick={async () => {
                  const a = await createAssessment.mutateAsync({ title: "TOPP QA Maturity Assessment" });
                  setAssessmentId(a.assessmentId);
                }}>
                Start assessment
              </Button>
            }
          />
        </Card>
      </Box>
    );
  }

  const isSubmitted = (summary?.status ?? 0) >= AssessmentStatus.Submitted;

  return (
    <Box sx={{ pb: 9 }}>
      <PageHeader
        title={summary?.title ?? "My Assessment"}
        subtitle={currentSub ? `${currentSub.category} · ${currentSub.module}` : "Select a submodule to begin"}
      />

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "320px 1fr" } }}>
        {/* Tree nav */}
        <Card sx={{ p: 1, alignSelf: "start", maxHeight: "70vh", overflowY: "auto" }}>
          {treeQuery.isLoading ? (
            <LoadingState label="Loading questions…" />
          ) : (
            tree.map((c) => (
              <Box key={c.categoryId} sx={{ mb: 1 }}>
                <Typography variant="overline" color="text.secondary" sx={{ px: 1.5 }}>{c.name}</Typography>
                {c.modules.map((m) => {
                  const open = openModules[m.moduleId];
                  return (
                    <Box key={m.moduleId}>
                      <Stack direction="row" alignItems="center" sx={{ px: 1, py: 0.5, cursor: "pointer" }}
                        onClick={() => setOpenModules((s) => ({ ...s, [m.moduleId]: !open }))}>
                        {open ? <ExpandMoreIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ flexGrow: 1 }}>{m.name}</Typography>
                      </Stack>
                      <Collapse in={open}>
                        {m.subModules.map((s) => {
                          const done = answeredInSub(s.questions);
                          const complete = s.questions.length > 0 && done === s.questions.length;
                          const active = s.subModuleId === selectedSub;
                          return (
                            <Stack key={s.subModuleId} direction="row" spacing={1} alignItems="center"
                              onClick={() => setSelectedSub(s.subModuleId)}
                              sx={{ ml: 2, px: 1.5, py: 0.75, borderRadius: 2, cursor: "pointer",
                                bgcolor: active ? "action.selected" : "transparent",
                                "&:hover": { bgcolor: active ? "action.selected" : "action.hover" } }}>
                              {complete
                                ? <CheckCircleIcon fontSize="small" color="success" />
                                : <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "text.disabled" }} />}
                              <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>{s.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{done}/{s.questions.length}</Typography>
                            </Stack>
                          );
                        })}
                      </Collapse>
                    </Box>
                  );
                })}
              </Box>
            ))
          )}
        </Card>

        {/* Questions */}
        <Card sx={{ p: 3 }}>
          {!currentSub ? (
            <EmptyState title="Select a submodule" description="Pick a submodule from the left to answer its questions." />
          ) : (
            <>
              <Typography variant="h2" sx={{ mb: 2 }}>{currentSub.sub.name}</Typography>
              <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />} spacing={2.5}>
                {currentSub.sub.questions.map((q, i) => {
                  const value = answersByQuestion.get(q.questionId);
                  return (
                    <Box key={q.questionId} sx={{ pt: i === 0 ? 0 : 2.5 }}>
                      <Typography variant="body1" fontWeight={500} sx={{ mb: q.guidance ? 0.5 : 1.5 }}>
                        {i + 1}. {q.text}
                      </Typography>
                      {q.guidance && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>{q.guidance}</Typography>
                      )}
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <ToggleButtonGroup exclusive size="small" value={value ?? null} disabled={isSubmitted}
                          onChange={(_, v: number | null) => v !== null && answer(q.questionId, v)}>
                          {OPTIONS.map((opt) => {
                            const label = answerLabel[opt];
                            return (
                              <ToggleButton key={opt} value={opt} sx={{ px: 2.5,
                                "&.Mui-selected": { bgcolor: alpha(answerColor[label], 0.14), color: answerColor[label],
                                  borderColor: alpha(answerColor[label], 0.4), "&:hover": { bgcolor: alpha(answerColor[label], 0.2) } } }}>
                                {label}
                              </ToggleButton>
                            );
                          })}
                        </ToggleButtonGroup>
                        <IconButton size="small" aria-label="Add findings" disabled={isSubmitted}
                          onClick={() => setOpenNotes((s) => ({ ...s, [q.questionId]: !s[q.questionId] }))}>
                          <NotesOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Collapse in={openNotes[q.questionId]}>
                        <TextField fullWidth size="small" placeholder="Findings / notes (optional)" multiline minRows={2}
                          sx={{ mt: 1.5 }} disabled={isSubmitted}
                          value={notes[q.questionId] ?? detail.data?.responses.find((r) => r.questionId === q.questionId)?.findings ?? ""}
                          onChange={(e) => setNotes({ ...notes, [q.questionId]: e.target.value })}
                          onBlur={() => saveNote(q.questionId)} />
                      </Collapse>
                    </Box>
                  );
                })}
                {currentSub.sub.questions.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No questions in this submodule.</Typography>
                )}
              </Stack>
            </>
          )}
        </Card>
      </Box>

      {/* Sticky footer */}
      <Box sx={{ position: "fixed", bottom: 0, left: { xs: 0, md: 264 }, right: 0, bgcolor: "background.paper",
        borderTop: 1, borderColor: "divider", px: 3, py: 1.5, zIndex: 5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ flexGrow: 1, maxWidth: 420 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {summary?.answeredCount ?? 0} / {summary?.questionCount ?? 0} answered
              </Typography>
              <Typography variant="caption" fontWeight={600}>{percent}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={percent} sx={{ height: 6, borderRadius: 999 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {saveResponse.isPending && <Chip size="small" label="Saving…" />}
          {isSubmitted ? (
            <Chip color="success" label="Submitted" />
          ) : (
            <Button variant="contained" disabled={submit.isPending || (summary?.answeredCount ?? 0) === 0}
              onClick={() => submit.mutate()}>
              Submit
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
