import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { alpha } from "@mui/material/styles";
import { EmptyState, LoadingState, PageHeader, StatusChip, type EntityStatus } from "shared/components";
import { useHierarchy } from "shared/api/catalog";
import { useAssessment, useAssessments, useSaveResponse, useStartAssessment, useSubmitAssessment } from "shared/api/assessments";
import {
  AnswerOption,
  AssessmentStatus,
  answerLabel,
  assessmentStatusLabel,
  type AssessmentSummaryDto,
} from "shared/api/types";
import { answerColor } from "shared/domain/maturity";
import { useAuthContext } from "contexts/AuthContext";
import {
  useClearResumePointer,
  useResumePointer,
  useSaveResumePointer,
} from "shared/api/dashboardGovernance";
import {
  ASSESSMENT_LINK_NAVIGATION_SOURCE,
  isAssessmentLinkNavigationState,
  type AssessmentNavigationState,
} from "shared/constants/assessmentNavigation";
import { portalAgentAnalysisPath } from "shared/constants/routePaths";

const OPTIONS = [AnswerOption.No, AnswerOption.Partial, AnswerOption.Yes];
const MIN_SUBMIT_COMPLETION_PERCENT = 50;
type AssessmentDetailQuery = ReturnType<typeof useAssessment>;
type SubmittedAssessmentPrompt = {
  assessmentId: string;
  title: string;
  score?: number | null;
};
export function MyAssessmentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const assessmentsQuery = useAssessments(user?.userId);
  const resumePointerQuery = useResumePointer(user?.userId);
  const saveResumePointerMutation = useSaveResumePointer(user?.userId);
  const clearResumePointerMutation = useClearResumePointer(user?.userId);
  const [assessmentId, setAssessmentId] = useState<string | undefined>();
  const [questionMode, setQuestionMode] = useState(false);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(() => new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [optimisticAnswers, setOptimisticAnswers] = useState<Record<string, number>>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [completedAssessmentIds, setCompletedAssessmentIds] = useState<Set<string>>(() => new Set());
  const [submittedPrompt, setSubmittedPrompt] = useState<SubmittedAssessmentPrompt | null>(null);
  const handledLocationKey = useRef<string | null>(null);
  const resumedLocationKey = useRef<string | null>(null);
  const resumeScrollQuestionId = useRef<string | null>(null);
  const resumeScrollApplied = useRef(false);
  const resumePointerReady = !user?.userId || resumePointerQuery.isFetched;

  const navigationState = location.state as AssessmentNavigationState;
  const navigationAssessmentId = navigationState?.assessmentId;
  const shouldResumeNavigation = navigationState?.resume === true;
  const isAssessmentLinkNavigation = isAssessmentLinkNavigationState(location.state);
  const assessments = useMemo(
    () =>
      (assessmentsQuery.data ?? []).filter(
        (assessment) =>
          assessment.status <= AssessmentStatus.InProgress &&
          !completedAssessmentIds.has(assessment.assessmentId),
      ),
    [assessmentsQuery.data, completedAssessmentIds],
  );

  useEffect(() => {
    const rows = assessments;

    if (!rows.length) {
      if (assessmentId) {
        setAssessmentId(undefined);
        setStartError(null);
        setQuestionMode(false);
        setSelectedSub(null);
        setSelectedQuestionId(null);
        setExpandedCategoryIds(new Set());
        setNotes({});
        setOpenNotes({});
        setReviewOpen(false);
      }
      return;
    }

    const hasNavigationTarget = Boolean(
      handledLocationKey.current !== location.key &&
        navigationAssessmentId &&
        rows.some((assessment) => assessment.assessmentId === navigationAssessmentId),
    );

    if (hasNavigationTarget && navigationAssessmentId) {
      handledLocationKey.current = location.key;
      setAssessmentId(navigationAssessmentId);
      setStartError(null);
      setQuestionMode(false);
      setSelectedSub(null);
      setSelectedQuestionId(null);
      setExpandedCategoryIds(new Set());
      setNotes({});
      setOpenNotes({});
      setReviewOpen(false);
      return;
    }

    if (handledLocationKey.current !== location.key) {
      handledLocationKey.current = location.key;
    }

    const selectedStillExists = assessmentId
      ? rows.some((assessment) => assessment.assessmentId === assessmentId)
      : false;

    if (selectedStillExists) return;

    setAssessmentId(rows[0].assessmentId);
    setStartError(null);
    setQuestionMode(false);
    setSelectedSub(null);
    setSelectedQuestionId(null);
    setExpandedCategoryIds(new Set());
    setNotes({});
    setOpenNotes({});
    setOptimisticAnswers({});
    setReviewOpen(false);
  }, [assessmentId, assessments, location.key, navigationAssessmentId]);

  const selectedSummary = useMemo(
    () => assessments.find((assessment) => assessment.assessmentId === assessmentId),
    [assessmentId, assessments],
  );

  const detail = useAssessment(assessmentId);
  const treeQuery = useHierarchy(false, true);
  const saveResponse = useSaveResponse(assessmentId ?? "");
  const startAssessment = useStartAssessment(assessmentId ?? "");
  const submit = useSubmitAssessment(assessmentId ?? "");

  const tree = treeQuery.data ?? [];
  const savedAnswersByQuestion = useMemo(() => {
    const map = new Map<string, number>();
    detail.data?.responses.forEach((r) => map.set(r.questionId, r.answer));
    return map;
  }, [detail.data]);

  const answersByQuestion = useMemo(() => {
    const map = new Map(savedAnswersByQuestion);
    Object.entries(optimisticAnswers).forEach(([questionId, value]) => map.set(questionId, value));
    return map;
  }, [optimisticAnswers, savedAnswersByQuestion]);

  useEffect(() => {
    setOptimisticAnswers((current) => {
      let changed = false;
      const next = { ...current };

      Object.entries(current).forEach(([questionId, value]) => {
        if (savedAnswersByQuestion.get(questionId) === value) {
          delete next[questionId];
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [savedAnswersByQuestion]);

  const summary = detail.data?.summary ?? selectedSummary;
  const selectedQuestionSet = useMemo(() => {
    const ids = summary?.questionIds ?? [];
    return ids.length ? new Set(ids) : null;
  }, [summary?.questionIds]);

  const filteredTree = useMemo(() => {
    return tree
      .map((category) => ({
        ...category,
        modules: category.modules
          .map((module) => ({
            ...module,
            subModules: module.subModules
              .map((subModule) => ({
                ...subModule,
                questions: selectedQuestionSet
                  ? subModule.questions.filter((question) => selectedQuestionSet.has(question.questionId))
                  : subModule.questions,
              }))
              .filter((subModule) => subModule.questions.length > 0),
          }))
          .filter((module) => module.subModules.length > 0),
      }))
      .filter((category) => category.modules.length > 0);
  }, [selectedQuestionSet, tree]);

  const categoryQuestionGroups = useMemo(() => {
    return filteredTree
      .map((category) => {
        const questions = category.modules
          .flatMap((module) =>
            module.subModules.flatMap((sub) =>
              sub.questions.map((question) => ({
                categoryId: category.categoryId,
                category: category.name,
                moduleId: module.moduleId,
                module: module.name,
                sub,
                question,
              })),
            ),
          )
          .map((step, index) => ({ ...step, questionNumber: index + 1 }));

        return {
          categoryId: category.categoryId,
          category: category.name,
          questions,
        };
      })
      .filter((category) => category.questions.length > 0);
  }, [filteredTree]);

  const questionSteps = useMemo(
    () => categoryQuestionGroups.flatMap((category) => category.questions),
    [categoryQuestionGroups],
  );
  const questionCount = summary?.questionCount ?? questionSteps.length;
  const answeredCount = Math.min(
    questionCount,
    Math.max(summary?.answeredCount ?? 0, answersByQuestion.size),
  );
  const percent =
    questionCount > 0
      ? Math.round((answeredCount / questionCount) * 100)
      : Math.round(summary?.completionPercentage ?? 0);
  const canSubmitAssessment = percent >= MIN_SUBMIT_COMPLETION_PERCENT;

  const currentQuestionIndex = useMemo(
    () => questionSteps.findIndex((step) => step.question.questionId === selectedQuestionId),
    [selectedQuestionId, questionSteps],
  );

  const currentQuestionStep = currentQuestionIndex >= 0 ? questionSteps[currentQuestionIndex] : null;
  const selectedCategoryGroup = useMemo(() => {
    const selectedCategoryId = currentQuestionStep?.categoryId;
    return (
      categoryQuestionGroups.find((category) => category.categoryId === selectedCategoryId) ??
      categoryQuestionGroups[0] ??
      null
    );
  }, [categoryQuestionGroups, currentQuestionStep?.categoryId]);
  const selectedCategoryIndex = useMemo(
    () => categoryQuestionGroups.findIndex((category) => category.categoryId === selectedCategoryGroup?.categoryId),
    [categoryQuestionGroups, selectedCategoryGroup?.categoryId],
  );

  useEffect(() => {
    if (!questionMode) return;
    if ((!selectedSub || !selectedQuestionId || currentQuestionIndex < 0) && questionSteps.length) {
      const pointer = resumePointerQuery.data;
      const pointerStep = pointer && pointer.assessmentId === assessmentId
        ? questionSteps.find((step) => step.question.questionId === pointer.questionId)
          ?? questionSteps.find((step) => step.sub.subModuleId === pointer.subModuleId)
        : undefined;
      const firstStep = pointerStep ?? questionSteps[0];
      setSelectedSub(firstStep.sub.subModuleId);
      setSelectedQuestionId(firstStep.question.questionId);
    }
  }, [assessmentId, currentQuestionIndex, questionMode, selectedQuestionId, selectedSub, questionSteps, resumePointerReady, resumePointerQuery.data]);

  useEffect(() => {
    if (!questionMode || !selectedSub) return;
    const pointer = resumePointerQuery.data;
    if (!pointer || pointer.assessmentId !== assessmentId || pointer.subModuleId !== selectedSub || !pointer.questionId) return;
    if (resumeScrollApplied.current || pointer.questionId !== resumeScrollQuestionId.current) return;

    resumeScrollApplied.current = true;
    const timeoutId = window.setTimeout(() => {
      document.getElementById(`question-${pointer.questionId}`)?.scrollIntoView({ block: "center" });
    }, 100);
    return () => window.clearTimeout(timeoutId);
  }, [assessmentId, questionMode, selectedSub, resumePointerReady, resumePointerQuery.data]);

  const selectAssessment = (id: string) => {
    setAssessmentId(id);
    setStartError(null);
    setQuestionMode(false);
    setSelectedSub(null);
    setSelectedQuestionId(null);
    setExpandedCategoryIds(new Set());
    setNotes({});
    setOpenNotes({});
    setOptimisticAnswers({});
    setReviewOpen(false);
    resumeScrollQuestionId.current = null;
    resumeScrollApplied.current = false;
  };

  const openQuestions = async () => {
    if (!assessmentId) return;

    setStartError(null);

    try {
      await startAssessment.mutateAsync();
    } catch {
      setStartError("Could not update the start time right now. Your answers will still be saved when you continue.");
    }

    const pointer = resumePointerQuery.data;
    resumeScrollQuestionId.current =
      pointer?.assessmentId === assessmentId && pointer.questionId ? pointer.questionId : null;
    resumeScrollApplied.current = false;
    setQuestionMode(true);
    setSelectedSub(null);
    setSelectedQuestionId(null);
    setExpandedCategoryIds(new Set());
    setOpenNotes({});
    setOptimisticAnswers({});
    setReviewOpen(false);
  };

  useEffect(() => {
    if (!shouldResumeNavigation || !assessmentId || !resumePointerReady) return;
    if (navigationAssessmentId && navigationAssessmentId !== assessmentId) return;
    if (handledLocationKey.current !== location.key) return;
    if (resumedLocationKey.current === location.key) return;

    resumedLocationKey.current = location.key;
    void openQuestions();
  }, [assessmentId, location.key, navigationAssessmentId, resumePointerReady, shouldResumeNavigation]);

  const answer = (step: (typeof questionSteps)[number], value: number) => {
    if (!assessmentId) return;
    const questionId = step.question.questionId;
    setSelectedSub(step.sub.subModuleId);
    setSelectedQuestionId(questionId);
    setExpandedCategoryIds((current) => {
      if (current.has(step.categoryId)) return current;
      const next = new Set(current);
      next.add(step.categoryId);
      return next;
    });
    void saveResumePointerMutation
      .mutateAsync({ assessmentId, subModuleId: step.sub.subModuleId, questionId, touchedAtUtc: new Date().toISOString() })
      .catch(() => undefined);
    setOptimisticAnswers((state) => ({ ...state, [questionId]: value }));
    saveResponse.mutate(
      { questionId, answer: value, findings: notes[questionId] || null },
      {
        onError: (_error, variables) => {
          setOptimisticAnswers((state) => {
            if (state[variables.questionId] !== variables.answer) return state;

            const next = { ...state };
            const savedAnswer = savedAnswersByQuestion.get(variables.questionId);
            if (savedAnswer === undefined) {
              delete next[variables.questionId];
            } else {
              next[variables.questionId] = savedAnswer;
            }
            return next;
          });
        },
      },
    );
  };

  const saveNote = (questionId: string) => {
    const currentAnswer = answersByQuestion.get(questionId);
    if (!assessmentId || currentAnswer === undefined) return;
    saveResponse.mutate({ questionId, answer: currentAnswer, findings: notes[questionId] || null });
  };

  const goToQuestion = (step: (typeof questionSteps)[number] | null, shouldScroll = true) => {
    if (!step) return;
    if (assessmentId) {
      void saveResumePointerMutation
        .mutateAsync({
          assessmentId,
          subModuleId: step.sub.subModuleId,
          questionId: step.question.questionId,
          touchedAtUtc: new Date().toISOString(),
        })
        .catch(() => undefined);
    }
    setSelectedSub(step.sub.subModuleId);
    setSelectedQuestionId(step.question.questionId);
    if (shouldScroll) {
      window.setTimeout(() => {
        document.getElementById(`question-${step.question.questionId}`)?.scrollIntoView({ block: "center" });
      }, 0);
    }
  };

  const selectCategory = (category: (typeof categoryQuestionGroups)[number], hasAnsweredQuestions: boolean) => {
    goToQuestion(category.questions[0] ?? null, false);
    setExpandedCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(category.categoryId) && !hasAnsweredQuestions) {
        next.delete(category.categoryId);
      } else {
        next.add(category.categoryId);
      }
      return next;
    });
  };

  const nextCategoryGroup =
    selectedCategoryIndex >= 0
      ? categoryQuestionGroups[selectedCategoryIndex + 1] ?? null
      : categoryQuestionGroups[0] ?? null;

  const goToNextCategory = () => {
    if (!nextCategoryGroup) return;

    setExpandedCategoryIds((current) => {
      if (current.has(nextCategoryGroup.categoryId)) return current;
      const next = new Set(current);
      next.add(nextCategoryGroup.categoryId);
      return next;
    });
    goToQuestion(nextCategoryGroup.questions[0] ?? null);
  };

  const resultDialog = (
    <AssessmentResultDialog
      prompt={submittedPrompt}
      onClose={() => setSubmittedPrompt(null)}
      onAnalyze={() => {
        if (!submittedPrompt) return;
        const targetAssessmentId = submittedPrompt.assessmentId;
        setSubmittedPrompt(null);
        navigate(portalAgentAnalysisPath(targetAssessmentId), {
          state: isAssessmentLinkNavigationState(location.state)
            ? { resume: true, source: ASSESSMENT_LINK_NAVIGATION_SOURCE }
            : undefined,
        });
      }}
    />
  );

  if (assessmentsQuery.isLoading) {
    return (
      <>
        <LoadingState label="Loading your assessments..." />
        {resultDialog}
      </>
    );
  }

  if (assessmentsQuery.isError) {
    return (
      <>
        <Box>
          <PageHeader title="My Assessments" subtitle="Review your assigned TOPP QA maturity assessments." />
          <Card sx={{ p: 4 }}>
            <EmptyState
              title="Could not load assessments"
              description="Your assigned assessments could not be loaded. Please try again in a moment."
            />
          </Card>
        </Box>
        {resultDialog}
      </>
    );
  }

  if (!assessments.length) {
    return (
      <>
        <Box>
          <PageHeader title="My Assessments" subtitle="Review your assigned TOPP QA maturity assessments." />
          <Card sx={{ p: 4 }}>
            <EmptyState
              title="No assessment is assigned to you"
              description="Completed assessments are available in History and Reports."
            />
          </Card>
        </Box>
        {resultDialog}
      </>
    );
  }

  if (!questionMode) {
    return (
      <>
        <AssessmentDetailView
          assessments={assessments}
          selectedId={assessmentId}
          selectedSummary={selectedSummary}
          detail={detail}
          startError={startError}
          isStarting={startAssessment.isPending}
          onSelect={selectAssessment}
          onStartQuestions={openQuestions}
        />
        {resultDialog}
      </>
    );
  }

  const isSubmitted = (summary?.status ?? 0) >= AssessmentStatus.Submitted;
  const unansweredCount = Math.max(questionCount - answeredCount, 0);
  const selectedCategoryAnsweredCount = selectedCategoryGroup
    ? selectedCategoryGroup.questions.filter((step) => answersByQuestion.has(step.question.questionId)).length
    : 0;

  return (
    <Box sx={{ pb: 9 }}>
      <PageHeader
        title={summary?.title ?? "My Assessment"}
        subtitle={selectedCategoryGroup ? selectedCategoryGroup.category : "Select a category to begin"}
        actions={!isAssessmentLinkNavigation ? (
          <Button variant="outlined" startIcon={<KeyboardArrowLeftIcon />} onClick={() => setQuestionMode(false)}>
            Assessment details
          </Button>
        ) : undefined}
      />

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "320px 1fr" } }}>
        <Card sx={{ p: 1, alignSelf: "start", maxHeight: "70vh", overflowY: "auto" }}>
          {treeQuery.isLoading ? (
            <LoadingState label="Loading questions..." />
          ) : (
            categoryQuestionGroups.map((category) => {
              const answeredInCategory = category.questions.filter((step) =>
                answersByQuestion.has(step.question.questionId),
              ).length;
              const expanded = answeredInCategory > 0 || expandedCategoryIds.has(category.categoryId);
              const activeCategory = selectedCategoryGroup?.categoryId === category.categoryId;

              return (
                <Box key={category.categoryId} sx={{ mb: 0.75 }}>
                  <Stack
                    role="button"
                    tabIndex={0}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    aria-expanded={expanded}
                    onClick={() => selectCategory(category, answeredInCategory > 0)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectCategory(category, answeredInCategory > 0);
                      }
                    }}
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderRadius: 2,
                      cursor: "pointer",
                      bgcolor: activeCategory ? "action.selected" : "transparent",
                      transition: "background-color 180ms",
                      "&:hover": { bgcolor: activeCategory ? "action.selected" : "action.hover" },
                      "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                    }}
                  >
                    <KeyboardArrowRightIcon
                      fontSize="small"
                      sx={{
                        color: "text.secondary",
                        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 180ms",
                      }}
                    />
                    <Typography variant="overline" color="text.secondary" noWrap sx={{ flexGrow: 1 }}>
                      {category.category}
                    </Typography>
                    <Chip
                      size="small"
                      variant={answeredInCategory > 0 ? "filled" : "outlined"}
                      color={answeredInCategory > 0 ? "success" : "default"}
                      label={`${answeredInCategory}/${category.questions.length}`}
                    />
                  </Stack>
                  <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Stack spacing={0.35} sx={{ mt: 0.35, pl: 1 }}>
                      {category.questions.map((step) => {
                        const answered = answersByQuestion.has(step.question.questionId);
                        const active = step.question.questionId === selectedQuestionId;

                        return (
                          <Stack
                            key={step.question.questionId}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            onClick={() => goToQuestion(step)}
                            sx={{
                              px: 1.5,
                              py: 0.75,
                              borderRadius: 2,
                              cursor: "pointer",
                              bgcolor: active ? "action.selected" : "transparent",
                              "&:hover": { bgcolor: active ? "action.selected" : "action.hover" },
                            }}
                          >
                            {answered ? (
                              <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "text.disabled" }} />
                            )}
                            <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                              Question {step.questionNumber}
                            </Typography>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Collapse>
                </Box>
              );
            })
          )}
        </Card>

        <Card sx={{ p: { xs: 2, md: 3 } }}>
          {!selectedCategoryGroup ? (
            <EmptyState title="Select a category" description="Pick a category from the left to continue the assessment." />
          ) : (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h2">{selectedCategoryGroup.category}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCategoryAnsweredCount} / {selectedCategoryGroup.questions.length} questions answered
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={`Category ${selectedCategoryIndex + 1} of ${categoryQuestionGroups.length}`}
                  color="primary"
                  variant="outlined"
                />
              </Stack>
              <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />} spacing={2.5}>
                {selectedCategoryGroup.questions.map((step) => {
                  const q = step.question;
                  const value = answersByQuestion.get(q.questionId);
                  return (
                    <Box key={q.questionId} id={`question-${q.questionId}`}>
                      <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                        Question {step.questionNumber}
                      </Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ mb: 1.5 }}>
                        {q.text}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Stack
                          role="radiogroup"
                          aria-label={`Answer question ${step.questionNumber}`}
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {OPTIONS.map((opt) => {
                            const label = answerLabel[opt];
                            const selected = value === opt;
                            const color = answerColor[label];
                            return (
                              <Button
                                key={opt}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                variant={selected ? "contained" : "outlined"}
                                disableElevation
                                disabled={isSubmitted}
                                onClick={() => answer(step, opt)}
                                sx={{
                                  minWidth: 92,
                                  minHeight: 40,
                                  px: 2.25,
                                  borderColor: alpha(color, selected ? 0.55 : 0.32),
                                  bgcolor: selected ? alpha(color, 0.16) : "background.paper",
                                  color: selected ? color : "text.primary",
                                  fontWeight: 800,
                                  cursor: isSubmitted ? "default" : "pointer",
                                  "&:hover": {
                                    bgcolor: selected ? alpha(color, 0.22) : alpha(color, 0.08),
                                    borderColor: alpha(color, 0.6),
                                  },
                                  "&.Mui-disabled": {
                                    bgcolor: selected ? alpha(color, 0.12) : "action.disabledBackground",
                                    borderColor: selected ? alpha(color, 0.32) : "action.disabled",
                                    color: selected ? color : "text.disabled",
                                  },
                                }}
                              >
                                {label}
                              </Button>
                            );
                          })}
                        </Stack>
                        <IconButton
                          size="small"
                          aria-label="Add findings"
                          disabled={isSubmitted}
                          onClick={() => setOpenNotes((s) => ({ ...s, [q.questionId]: !s[q.questionId] }))}
                        >
                          <NotesOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Collapse in={openNotes[q.questionId]}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Findings / notes (optional)"
                          multiline
                          minRows={2}
                          sx={{ mt: 1.5 }}
                          disabled={isSubmitted}
                          value={notes[q.questionId] ?? detail.data?.responses.find((r) => r.questionId === q.questionId)?.findings ?? ""}
                          onChange={(e) => setNotes({ ...notes, [q.questionId]: e.target.value })}
                          onBlur={() => saveNote(q.questionId)}
                        />
                      </Collapse>
                    </Box>
                  );
                })}
              </Stack>
            </>
          )}
        </Card>
      </Box>

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: { xs: 0, md: isAssessmentLinkNavigation ? 0 : 264 },
          right: 0,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          px: 3,
          py: 1.5,
          zIndex: 5,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Box sx={{ flexGrow: 1, maxWidth: 420, minWidth: { xs: "100%", md: 320 } }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {answeredCount} / {questionCount} answered
              </Typography>
              <Typography variant="caption" fontWeight={600}>{percent}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={percent} sx={{ height: 6, borderRadius: 999 }} />
            {!canSubmitAssessment && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                Complete at least {MIN_SUBMIT_COMPLETION_PERCENT}% to enable submit.
              </Typography>
            )}
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {saveResponse.isPending && <Chip size="small" label="Saving..." />}
          {isSubmitted ? (
            <Chip color="success" label="Submitted" />
          ) : (
            <>
              <Button
                variant="outlined"
                endIcon={<KeyboardArrowRightIcon />}
                disabled={!nextCategoryGroup}
                onClick={goToNextCategory}
              >
                Next section
              </Button>
              <Button
                variant="contained"
                disabled={submit.isPending || !canSubmitAssessment}
                onClick={() => setReviewOpen(true)}
              >
                Submit
              </Button>
            </>
          )}
        </Stack>
      </Box>

      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review assessment before submit</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Check your progress before final submission. You can go back and answer more questions, or submit now.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Answered</Typography>
                <Typography variant="h2" color="success.main">{answeredCount}</Typography>
              </Card>
              <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Not answered</Typography>
                <Typography variant="h2" color={unansweredCount > 0 ? "warning.main" : "success.main"}>
                  {unansweredCount}
                </Typography>
              </Card>
              <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Total</Typography>
                <Typography variant="h2">{questionCount}</Typography>
              </Card>
            </Stack>
            <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 999 }} />
            {!canSubmitAssessment && (
              <Alert severity="info">Complete at least {MIN_SUBMIT_COMPLETION_PERCENT}% of the assessment to submit.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)}>Go back</Button>
          <Button
            variant="contained"
            disabled={submit.isPending || !canSubmitAssessment}
            onClick={() => {
              submit.mutate(undefined, {
                onSuccess: (submittedDetail) => {
                  const submittedAssessmentId = submittedDetail.summary.assessmentId;
                  setSubmittedPrompt({
                    assessmentId: submittedAssessmentId,
                    title: submittedDetail.summary.title,
                    score: submittedDetail.summary.overallScore,
                  });
                  if (submittedAssessmentId) {
                    setCompletedAssessmentIds((ids) => {
                      const next = new Set(ids);
                      next.add(submittedAssessmentId);
                      return next;
                    });
                  }
                  setReviewOpen(false);
                  setQuestionMode(false);
                  setAssessmentId(undefined);
                  setSelectedSub(null);
                  setSelectedQuestionId(null);
                  setNotes({});
                  setOpenNotes({});
                  void clearResumePointerMutation.mutateAsync().catch(() => undefined);
                },
              });
            }}
          >
            Submit assessment
          </Button>
        </DialogActions>
      </Dialog>
      {resultDialog}
    </Box>
  );
}

function AssessmentResultDialog({
  prompt,
  onClose,
  onAnalyze,
}: {
  prompt: SubmittedAssessmentPrompt | null;
  onClose: () => void;
  onAnalyze: () => void;
}) {
  const scoreLabel = typeof prompt?.score === "number" ? `${Math.round(prompt.score)}%` : "Ready";

  return (
    <Dialog open={Boolean(prompt)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 7 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <CheckCircleIcon color="success" fontSize="small" />
          <span>Your responses are ready</span>
        </Stack>
        <IconButton
          aria-label="Close results popup"
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", top: 12, right: 12 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Your assessment has been submitted and scored. TestScan Agent can now read your responses, identify patterns,
            and prepare practical feedback for you.
          </Typography>
          <Box sx={{ p: 1.75, border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.default" }}>
            <Typography variant="caption" color="text.secondary">
              {prompt?.title ?? "Submitted assessment"}
            </Typography>
            <Typography variant="h2" sx={{ mt: 0.5 }}>
              {scoreLabel}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onAnalyze} fullWidth>
          Analyse your responses by TestScan Agent
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface AssessmentDetailViewProps {
  assessments: AssessmentSummaryDto[];
  selectedId?: string;
  selectedSummary?: AssessmentSummaryDto;
  detail: AssessmentDetailQuery;
  startError?: string | null;
  isStarting?: boolean;
  onSelect: (id: string) => void;
  onStartQuestions: () => void | Promise<void>;
}

function AssessmentDetailView({
  assessments,
  selectedId,
  selectedSummary,
  detail,
  startError,
  isStarting,
  onSelect,
  onStartQuestions,
}: AssessmentDetailViewProps) {
  const summary = detail.data?.summary ?? selectedSummary;
  const percent = Math.round(summary?.completionPercentage ?? 0);
  const unansweredCount = Math.max((summary?.questionCount ?? 0) - (summary?.answeredCount ?? 0), 0);

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title="My Assessments"
        subtitle="Review the assessment assigned by your administrator before opening the questions."
      />

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "320px 1fr" } }}>
        <Card sx={{ p: 1, alignSelf: "start" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 1 }}>
            <Typography variant="overline" color="text.secondary">Assigned assessments</Typography>
            <Chip size="small" variant="outlined" label={assessments.length} />
          </Stack>
          <Stack spacing={0.75}>
            {assessments.map((assessment) => {
              const active = assessment.assessmentId === selectedId;
              return (
                <Box
                  key={assessment.assessmentId}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(assessment.assessmentId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(assessment.assessmentId);
                    }
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: active ? "primary.main" : "divider",
                    bgcolor: active ? "action.selected" : "transparent",
                    cursor: "pointer",
                    transition: "background-color 200ms, border-color 200ms",
                    "&:hover": { bgcolor: active ? "action.selected" : "action.hover" },
                    "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                  }}
                >
                  <Typography variant="body2" fontWeight={700} noWrap>{assessment.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Assigned {formatDate(assessment.createdAtUtc)}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                    <StatusChip status={toEntityStatus(assessment.status)} />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(assessment.completionPercentage)}%
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Card>

        <Card sx={{ p: { xs: 2, md: 3 } }}>
          {detail.isLoading && !summary ? (
            <LoadingState label="Loading assessment details..." />
          ) : summary ? (
            <>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "flex-start" }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="overline" color="text.secondary">Assigned by administrator</Typography>
                  <Typography variant="h2" sx={{ mt: 0.5 }}>{summary.title}</Typography>
                  {summary.description ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
                      {summary.description}
                    </Typography>
                  ) : null}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                    <StatusChip status={toEntityStatus(summary.status)} />
                    <Chip size="small" variant="outlined" label={`Assigned ${formatDate(summary.createdAtUtc)}`} />
                    {summary.startedAtUtc ? (
                      <Chip size="small" variant="outlined" label={`Started ${formatDate(summary.startedAtUtc)}`} />
                    ) : null}
                  </Stack>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  disabled={detail.isLoading || detail.isError || isStarting}
                  onClick={onStartQuestions}
                  sx={{ minHeight: 44, px: 2.5, whiteSpace: "nowrap" }}
                >
                  {summary.status === AssessmentStatus.Draft ? "Start assessment" : "Continue assessment"}
                </Button>
              </Stack>

              {startError ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {startError}
                </Alert>
              ) : null}

              {detail.isError ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Assessment details could not be loaded. Please refresh before opening the questions.
                </Alert>
              ) : null}

              <Box sx={{ mt: 3 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                  <Typography variant="caption" color="text.secondary">
                    {summary.answeredCount} / {summary.questionCount} answered
                  </Typography>
                  <Typography variant="caption" fontWeight={700}>{percent}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 999 }} />
              </Box>

              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, mt: 3 }}>
                <DetailMetric label="Questions" value={summary.questionCount} helper="Total assigned" />
                <DetailMetric label="Answered" value={summary.answeredCount} helper="Saved responses" />
                <DetailMetric label="Remaining" value={unansweredCount} helper="Still open" />
                <DetailMetric
                  label="Score"
                  value={summary.overallScore == null ? "Pending" : Math.round(summary.overallScore)}
                  helper={summary.overallMaturityLevel ?? "After scoring"}
                />
              </Box>
            </>
          ) : (
            <EmptyState title="Select an assessment" description="Choose an assigned assessment to review its details." />
          )}
        </Card>
      </Box>
    </Box>
  );
}

function DetailMetric({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2, minHeight: 106 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h2" sx={{ mt: 0.5 }}>{value}</Typography>
      {helper ? <Typography variant="caption" color="text.secondary">{helper}</Typography> : null}
    </Box>
  );
}

function toEntityStatus(status: number): EntityStatus {
  if (status === AssessmentStatus.Draft) {
    return "Pending";
  }

  const label = assessmentStatusLabel[status] as EntityStatus | undefined;
  return label ?? "Draft";
}

function formatDate(value?: string | null) {
  if (!value) return "Not started";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

