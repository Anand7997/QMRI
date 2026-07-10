// Mirrors backend DTOs (QMRI.Application.Assessments.DTOs).
// Enums serialize as NUMBERS (System.Text.Json default).

export const AnswerOption = { No: 0, Partial: 1, Yes: 2 } as const;
export type AnswerOptionValue = (typeof AnswerOption)[keyof typeof AnswerOption];
export const answerLabel: Record<number, "No" | "Partial" | "Yes"> = { 0: "No", 1: "Partial", 2: "Yes" };

export const AssessmentStatus = {
  Draft: 0,
  InProgress: 1,
  Submitted: 2,
  Scored: 3,
  Archived: 4,
} as const;
export const assessmentStatusLabel: Record<number, string> = {
  0: "Draft",
  1: "InProgress",
  2: "Submitted",
  3: "Scored",
  4: "Archived",
};

export const ScoreScope = { Overall: 0, Category: 1, Module: 2, SubModule: 3 } as const;

export const RecommendationPriority = { Low: 0, Medium: 1, High: 2, Critical: 3 } as const;
export const priorityLabel: Record<number, "Low" | "Medium" | "High" | "Critical"> = {
  0: "Low",
  1: "Medium",
  2: "High",
  3: "Critical",
};

export interface QuestionDto {
  questionId: string;
  subModuleId: string;
  subModuleName: string;
  moduleId: string;
  moduleName: string;
  categoryId: string;
  categoryName: string;
  text: string;
  guidance?: string | null;
  weight: number;
  sortOrder: number;
  isActive: boolean;
}

export interface SubModuleDto {
  subModuleId: string;
  moduleId: string;
  moduleName: string;
  categoryId: string;
  categoryName: string;
  code: string;
  name: string;
  description?: string | null;
  weight: number;
  sortOrder: number;
  isActive: boolean;
  questionCount: number;
  questions: QuestionDto[];
}

export interface ModuleDto {
  moduleId: string;
  categoryId: string;
  categoryName: string;
  code: string;
  name: string;
  description?: string | null;
  weight: number;
  sortOrder: number;
  isActive: boolean;
  subModuleCount: number;
  questionCount: number;
  subModules: SubModuleDto[];
}

export interface CategoryDto {
  categoryId: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  moduleCount: number;
  subModuleCount: number;
  questionCount: number;
  modules: ModuleDto[];
}

export interface QuestionListResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: QuestionDto[];
}

export interface QuestionListRequest {
  categoryId?: string;
  moduleId?: string;
  subModuleId?: string;
  search?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UpsertCategoryRequest {
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface UpsertModuleRequest {
  categoryId: string;
  code: string;
  name: string;
  description?: string | null;
  weight: number;
  sortOrder: number;
  isActive: boolean;
}

export interface UpsertSubModuleRequest {
  moduleId: string;
  code: string;
  name: string;
  description?: string | null;
  weight: number;
  sortOrder: number;
  isActive: boolean;
}

export interface UpsertQuestionRequest {
  subModuleId: string;
  text: string;
  guidance?: string | null;
  weight: number;
  sortOrder: number;
  isActive: boolean;
}

export interface AssessmentSummaryDto {
  assessmentId: string;
  userId: string;
  assignedByUserId?: string | null;
  assignedByUserName?: string | null;
  assignedByFullName?: string | null;
  scoringModelId?: string | null;
  title: string;
  description?: string | null;
  departments: string[];
  questionIds: string[];
  status: number;
  startedAtUtc?: string | null;
  submittedAtUtc?: string | null;
  scoredAtUtc?: string | null;
  createdAtUtc: string;
  answeredCount: number;
  questionCount: number;
  completionPercentage: number;
  overallScore?: number | null;
  overallMaturityLevel?: string | null;
}

export interface AssessmentResponseDto {
  assessmentResponseId: string;
  assessmentId: string;
  questionId: string;
  answer: number;
  points: number;
  findings?: string | null;
  answeredAtUtc: string;
}

export interface AssessmentScoreDto {
  assessmentScoreId: string;
  assessmentId: string;
  scope: number;
  categoryId?: string | null;
  categoryName?: string | null;
  moduleId?: string | null;
  moduleName?: string | null;
  subModuleId?: string | null;
  subModuleName?: string | null;
  score: number;
  answeredCount: number;
  questionCount: number;
  maturityLevel?: string | null;
  calculatedAtUtc: string;
}

export interface RecommendationDto {
  recommendationId: string;
  assessmentId: string;
  categoryId?: string | null;
  categoryName?: string | null;
  moduleId?: string | null;
  moduleName?: string | null;
  title: string;
  description: string;
  priority: number;
  createdAtUtc: string;
}

export interface AssessmentDetailDto {
  summary: AssessmentSummaryDto;
  responses: AssessmentResponseDto[];
  scores: AssessmentScoreDto[];
  recommendations: RecommendationDto[];
}

export type ExamTakerProgressStatus = "NotStarted" | "InProgress" | "Finished";

export interface ExamTakerProgressDto {
  assessmentId: string;
  userId: string;
  userName: string;
  fullName: string;
  department: string;
  progressStatus: ExamTakerProgressStatus;
  answeredCount: number;
  questionCount: number;
  completionPercentage: number;
  overallScore?: number | null;
  startedAtUtc?: string | null;
  finishedAtUtc?: string | null;
}

export interface CreateAssessmentRequest {
  userId?: string | null;
  scoringModelId?: string | null;
  title?: string | null;
  description?: string | null;
  departments: string[];
  questionIds: string[];
}

export interface UpdateAssessmentRequest {
  title?: string | null;
  description?: string | null;
}
export interface UpsertAssessmentResponseRequest {
  questionId: string;
  answer: number;
  findings?: string | null;
}


