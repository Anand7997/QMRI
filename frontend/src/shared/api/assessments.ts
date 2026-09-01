import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "./axiosClient";
import type {
  AssessmentDetailDto,
  ExamTakerProgressDto,
  AssessmentResponseDto,
  AssessmentSummaryDto,
  CreateAssessmentRequest,
  QmriAgentAnalysisDto,
  UpdateAssessmentRequest,
  UpsertAssessmentResponseRequest,
} from "./types";

const keys = {
  list: (userId?: string) => ["assessments", "list", userId ?? "me"] as const,
  detail: (id: string) => ["assessments", "detail", id] as const,
  results: (id: string) => ["assessments", "results", id] as const,
  agentAnalysis: (id: string) => ["assessments", "agent-analysis", "qascan-v1", id] as const,
  examTakers: (id: string) => ["assessments", "exam-takers", id] as const,
};

export function useAssessments(userId?: string) {
  return useQuery({
    queryKey: keys.list(userId),
    queryFn: async () => {
      const { data } = await axiosClient.get<AssessmentSummaryDto[]>("/assessments", {
        params: userId ? { userId } : undefined,
      });
      return data;
    },
  });
}

export function useAssessment(assessmentId: string | undefined) {
  return useQuery({
    queryKey: keys.detail(assessmentId ?? ""),
    queryFn: async () => {
      const { data } = await axiosClient.get<AssessmentDetailDto>(`/assessments/${assessmentId}`);
      return data;
    },
    enabled: Boolean(assessmentId),
  });
}

export function useQmriAgentAnalysis(assessmentId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: keys.agentAnalysis(assessmentId ?? ""),
    queryFn: async () => {
      const { data } = await axiosClient.post<QmriAgentAnalysisDto>(
        `/assessments/${assessmentId}/agent-analysis`,
      );
      return data;
    },
    enabled: Boolean(assessmentId) && enabled,
    retry: false,
    staleTime: 30 * 60 * 1000,
  });
}

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAssessmentRequest) =>
      axiosClient.post<AssessmentSummaryDto>("/assessments", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });
}

export function useUpdateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAssessmentRequest }) =>
      axiosClient.put<AssessmentSummaryDto>(`/assessments/${id}`, body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      qc.invalidateQueries({ queryKey: keys.detail(variables.id) });
    },
  });
}

export function useDeleteAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/assessments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });
}
export function useSaveResponse(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertAssessmentResponseRequest) =>
      axiosClient
        .put<AssessmentResponseDto>(`/assessments/${assessmentId}/responses`, body)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.detail(assessmentId) }),
  });
}

export function useStartAssessment(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      axiosClient.post<AssessmentSummaryDto>(`/assessments/${assessmentId}/start`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      qc.invalidateQueries({ queryKey: keys.detail(assessmentId) });
    },
  });
}

export function useExamTakers(assessmentId: string | undefined) {
  return useQuery({
    queryKey: keys.examTakers(assessmentId ?? ""),
    queryFn: async () => {
      const { data } = await axiosClient.get<ExamTakerProgressDto[]>(`/assessments/${assessmentId}/exam-takers`);
      return data;
    },
    enabled: Boolean(assessmentId),
  });
}

export function useSubmitAssessment(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      axiosClient.post<AssessmentDetailDto>(`/assessments/${assessmentId}/submit`).then((r) => r.data),
    onSuccess: (detail) => {
      qc.setQueryData(keys.detail(assessmentId), detail);
      qc.invalidateQueries({ queryKey: ["assessments"] });
      qc.invalidateQueries({ queryKey: keys.detail(assessmentId) });
    },
  });
}
