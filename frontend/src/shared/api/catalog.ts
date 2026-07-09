import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "./axiosClient";
import type {
  CategoryDto,
  QuestionDto,
  QuestionListRequest,
  QuestionListResponse,
  SubModuleDto,
  ModuleDto,
  UpsertCategoryRequest,
  UpsertModuleRequest,
  UpsertQuestionRequest,
  UpsertSubModuleRequest,
} from "./types";

const catalogKeys = {
  tree: (includeInactive: boolean, includeQuestions: boolean) =>
    ["catalog", "tree", includeInactive, includeQuestions] as const,
  questions: (req: QuestionListRequest) => ["catalog", "questions", req] as const,
};

// ---- Hierarchy tree ----
export function useHierarchy(includeInactive = true, includeQuestions = false) {
  return useQuery({
    queryKey: catalogKeys.tree(includeInactive, includeQuestions),
    queryFn: async () => {
      const { data } = await axiosClient.get<CategoryDto[]>("/assessment-catalog/tree", {
        params: { includeInactive, includeQuestions },
      });
      return data;
    },
  });
}

// ---- Questions (server paged) ----
export function useQuestions(req: QuestionListRequest) {
  return useQuery({
    queryKey: catalogKeys.questions(req),
    queryFn: async () => {
      const { data } = await axiosClient.get<QuestionListResponse>("/assessment-catalog/questions", {
        params: req,
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

function useInvalidateCatalog() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["catalog"] });
}

// ---- Category CRUD ----
export function useCategoryMutations() {
  const invalidate = useInvalidateCatalog();
  const create = useMutation({
    mutationFn: (body: UpsertCategoryRequest) =>
      axiosClient.post<CategoryDto>("/assessment-catalog/categories", body).then((r) => r.data),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpsertCategoryRequest }) =>
      axiosClient.put<CategoryDto>(`/assessment-catalog/categories/${id}`, body).then((r) => r.data),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/assessment-catalog/categories/${id}`),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

// ---- Module CRUD ----
export function useModuleMutations() {
  const invalidate = useInvalidateCatalog();
  const create = useMutation({
    mutationFn: (body: UpsertModuleRequest) =>
      axiosClient.post<ModuleDto>("/assessment-catalog/modules", body).then((r) => r.data),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpsertModuleRequest }) =>
      axiosClient.put<ModuleDto>(`/assessment-catalog/modules/${id}`, body).then((r) => r.data),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/assessment-catalog/modules/${id}`),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

// ---- SubModule CRUD ----
export function useSubModuleMutations() {
  const invalidate = useInvalidateCatalog();
  const create = useMutation({
    mutationFn: (body: UpsertSubModuleRequest) =>
      axiosClient.post<SubModuleDto>("/assessment-catalog/submodules", body).then((r) => r.data),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpsertSubModuleRequest }) =>
      axiosClient.put<SubModuleDto>(`/assessment-catalog/submodules/${id}`, body).then((r) => r.data),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/assessment-catalog/submodules/${id}`),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

// ---- Question CRUD ----
export function useQuestionMutations() {
  const invalidate = useInvalidateCatalog();
  const create = useMutation({
    mutationFn: (body: UpsertQuestionRequest) =>
      axiosClient.post<QuestionDto>("/assessment-catalog/questions", body).then((r) => r.data),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpsertQuestionRequest }) =>
      axiosClient.put<QuestionDto>(`/assessment-catalog/questions/${id}`, body).then((r) => r.data),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/assessment-catalog/questions/${id}`),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}
