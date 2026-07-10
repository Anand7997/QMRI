import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { axiosClient } from "shared/api/axiosClient";
import { useAssessments } from "shared/api/assessments";
import {
  AssessmentStatus,
  RecommendationPriority,
  assessmentStatusLabel,
  priorityLabel,
  type AssessmentDetailDto,
  type AssessmentScoreDto,
  type AssessmentSummaryDto,
} from "shared/api/types";
import type { EntityStatus } from "shared/components";
import { maturityFor, type MaturityBand } from "shared/domain/maturity";
import { collapseAssessmentsByAssignment } from "shared/domain/assessmentGrouping";

export interface CategoryScore {
  category: string;
  score: number;
}

export interface BandDistributionItem {
  name: MaturityBand;
  value: number;
}

export interface RecentAssessment {
  id: string;
  title: string;
  status: EntityStatus;
  score: number | null;
  completionPercentage: number;
  date: string;
  assignedByUserId?: string | null;
  assignedByUserName?: string | null;
  assignedByFullName?: string | null;
}

export interface RecommendationItem {
  id: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  text: string;
  category: string;
  createdAtUtc: string;
}

export interface TrendPoint {
  month: string;
  score: number;
  completion: number;
}

const bandOrder: MaturityBand[] = ["Testing", "QA", "QE", "IQ"];

export function useAssessmentDashboardData(userId?: string) {
  const assessmentsQuery = useAssessments(userId);
  const assessments = useMemo(
    () => collapseAssessmentsByAssignment(assessmentsQuery.data ?? []),
    [assessmentsQuery.data],
  );

  const scoredIds = useMemo(
    () => assessments.filter((assessment) => assessment.status === AssessmentStatus.Scored).map((assessment) => assessment.assessmentId),
    [assessments],
  );

  const detailQueries = useQueries({
    queries: scoredIds.map((assessmentId) => ({
      queryKey: ["assessments", "detail", assessmentId] as const,
      queryFn: async () => {
        const { data } = await axiosClient.get<AssessmentDetailDto>(`/assessments/${assessmentId}`);
        return data;
      },
      enabled: assessmentsQuery.isSuccess,
    })),
  });

  const details = detailQueries.map((query) => query.data).filter((detail): detail is AssessmentDetailDto => Boolean(detail));

  const model = useMemo(() => buildAssessmentDashboardModel(assessments, details), [assessments, details]);

  return {
    ...model,
    isLoading: assessmentsQuery.isLoading || detailQueries.some((query) => query.isLoading),
    isError: assessmentsQuery.isError || detailQueries.some((query) => query.isError),
  };
}

function buildAssessmentDashboardModel(assessments: AssessmentSummaryDto[], details: AssessmentDetailDto[]) {
  const scored = assessments.filter((assessment) => assessment.status === AssessmentStatus.Scored && assessment.overallScore != null);
  const inProgress = assessments.filter((assessment) => assessment.status === AssessmentStatus.InProgress).length;
  const completed = assessments.filter(
    (assessment) => assessment.status === AssessmentStatus.Submitted || assessment.status === AssessmentStatus.Scored,
  ).length;
  const overallScore = average(scored.map((assessment) => assessment.overallScore ?? 0));
  const averageCompletion = average(assessments.map((assessment) => assessment.completionPercentage));

  return {
    assessments,
    details,
    assessmentCount: assessments.length,
    inProgressCount: inProgress,
    completedCount: completed,
    overallScore,
    averageCompletion,
    categoryScores: buildCategoryScores(details),
    bandDistribution: buildBandDistribution(scored),
    recentAssessments: buildRecentAssessments(assessments),
    topRecommendations: buildRecommendations(details),
    trendData: buildTrendData(scored),
  };
}

function buildCategoryScores(details: AssessmentDetailDto[]): CategoryScore[] {
  const grouped = new Map<string, number[]>();

  details.flatMap((detail) => detail.scores).forEach((score) => {
    if (!score.categoryName || score.score == null || !isCategoryScore(score)) {
      return;
    }

    const values = grouped.get(score.categoryName) ?? [];
    values.push(score.score);
    grouped.set(score.categoryName, values);
  });

  return Array.from(grouped.entries())
    .map(([category, scores]) => ({ category, score: average(scores) }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

function buildBandDistribution(scored: AssessmentSummaryDto[]): BandDistributionItem[] {
  const counts = new Map<MaturityBand, number>(bandOrder.map((band) => [band, 0]));

  scored.forEach((assessment) => {
    const score = assessment.overallScore ?? 0;
    const band = maturityFor(score).band;
    counts.set(band, (counts.get(band) ?? 0) + 1);
  });

  return bandOrder.map((band) => ({ name: band, value: counts.get(band) ?? 0 }));
}

function buildRecentAssessments(assessments: AssessmentSummaryDto[]): RecentAssessment[] {
  return [...assessments]
    .sort((a, b) => new Date(resolveAssessmentDate(b)).getTime() - new Date(resolveAssessmentDate(a)).getTime())
    .slice(0, 8)
    .map((assessment) => ({
      id: assessment.assessmentId,
      title: assessment.title,
      status: toEntityStatus(assessment.status),
      score: assessment.overallScore ?? null,
      completionPercentage: assessment.completionPercentage,
      date: resolveAssessmentDate(assessment),
      assignedByUserId: assessment.assignedByUserId ?? null,
      assignedByUserName: assessment.assignedByUserName ?? null,
      assignedByFullName: assessment.assignedByFullName ?? null,
    }));
}

function buildRecommendations(details: AssessmentDetailDto[]): RecommendationItem[] {
  return details
    .flatMap((detail) => detail.recommendations)
    .sort((a, b) => b.priority - a.priority || new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime())
    .slice(0, 8)
    .map((recommendation) => ({
      id: recommendation.recommendationId,
      priority: priorityLabel[recommendation.priority] ?? priorityLabel[RecommendationPriority.Low],
      text: recommendation.description || recommendation.title,
      category: recommendation.categoryName ?? recommendation.moduleName ?? "Assessment",
      createdAtUtc: recommendation.createdAtUtc,
    }));
}

function buildTrendData(scored: AssessmentSummaryDto[]): TrendPoint[] {
  const grouped = new Map<string, AssessmentSummaryDto[]>();

  scored.forEach((assessment) => {
    const month = new Intl.DateTimeFormat(undefined, { month: "short", year: "2-digit" }).format(new Date(resolveAssessmentDate(assessment)));
    const values = grouped.get(month) ?? [];
    values.push(assessment);
    grouped.set(month, values);
  });

  return Array.from(grouped.entries())
    .map(([month, values]) => ({
      month,
      score: average(values.map((assessment) => assessment.overallScore ?? 0)),
      completion: average(values.map((assessment) => assessment.completionPercentage)),
    }))
    .slice(-6);
}

function isCategoryScore(score: AssessmentScoreDto) {
  return Boolean(score.categoryId && score.categoryName && !score.moduleId && !score.subModuleId);
}

function toEntityStatus(status: number): EntityStatus {
  const label = assessmentStatusLabel[status] as EntityStatus | undefined;
  return label ?? "Draft";
}

function resolveAssessmentDate(assessment: AssessmentSummaryDto) {
  return assessment.scoredAtUtc ?? assessment.submittedAtUtc ?? assessment.startedAtUtc ?? assessment.createdAtUtc;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
