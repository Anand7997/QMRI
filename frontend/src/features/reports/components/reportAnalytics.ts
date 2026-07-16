import {
  AnswerOption,
  ScoreScope,
  priorityLabel,
  type AssessmentQuestionResultDto,
  type AssessmentScoreDto,
  type AssessmentSummaryDto,
  type RecommendationDto,
} from "shared/api/types";
import { brandTokens, dataTokens, semanticTokens } from "app/theme/tokens/palette";

/* ------------------------------------------------------------------ *
 * Maturity stages (1-5) - the domain's core scoring model.
 * Colours follow the brief: red = critical, yellow = attention,
 * blue = informational, green = strong.
 * ------------------------------------------------------------------ */
export interface StageInfo {
  level: number;
  label: string;
  description: string;
  color: string;
}

export const STAGES: StageInfo[] = [
  { level: 1, label: "Immature", description: "Foundational quality practices are still weak or inconsistent.", color: semanticTokens.errorMain },
  { level: 2, label: "Developing", description: "Some practices exist, but they are not yet consistent across teams.", color: semanticTokens.warningMain },
  { level: 3, label: "Defined", description: "Core practices are documented and repeatable, with room to improve coverage.", color: brandTokens.blue600 },
  { level: 4, label: "Managed", description: "Practices are measured, proactive, and broadly reliable.", color: dataTokens.bandIQ },
  { level: 5, label: "Optimized", description: "Capabilities are mature, data-driven, and continuously improving.", color: semanticTokens.successMain },
];

export function stageForScore(score: number): StageInfo {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  const level = normalized <= 20 ? 1 : normalized <= 40 ? 2 : normalized <= 60 ? 3 : normalized <= 80 ? 4 : 5;
  return STAGES[level - 1];
}

export function stageLabelForAverage(value: number) {
  if (value <= 1.5) return "Immature";
  if (value <= 2.5) return "Developing";
  if (value <= 3.5) return "Defined";
  if (value <= 4.5) return "Managed";
  return "Optimized";
}

/* ------------------------------------------------------------------ *
 * Overall status badge (Excellent / Good / Average / Poor)
 * ------------------------------------------------------------------ */
export interface StatusBadge {
  label: "Excellent" | "Good" | "Average" | "Poor";
  color: string;
  meaning: string;
}

export function statusBadgeFor(score: number): StatusBadge {
  if (score >= 81) return { label: "Excellent", color: semanticTokens.successMain, meaning: "Capabilities are mature and continuously improving." };
  if (score >= 61) return { label: "Good", color: dataTokens.bandIQ, meaning: "Practices are reliable with a few areas left to strengthen." };
  if (score >= 41) return { label: "Average", color: semanticTokens.warningMain, meaning: "Core practices exist but need consistent, focused improvement." };
  return { label: "Poor", color: semanticTokens.errorMain, meaning: "Foundational practices are weak and need immediate attention." };
}

/* ------------------------------------------------------------------ *
 * Category / module / sub-module grouping
 * ------------------------------------------------------------------ */
export interface SubModuleGroup {
  key: string;
  subModuleId: string;
  subModuleName: string;
  score: number;
  stage: StageInfo;
  answeredCount: number;
  questionCount: number;
  alignedCount: number;
  questions: AssessmentQuestionResultDto[];
}

export interface ModuleGroup {
  key: string;
  moduleId: string;
  moduleName: string;
  score: number;
  stage: StageInfo;
  answeredCount: number;
  questionCount: number;
  alignedCount: number;
  subModules: SubModuleGroup[];
}

export interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  score: number;
  stage: StageInfo;
  answeredCount: number;
  questionCount: number;
  alignedCount: number;
  modules: ModuleGroup[];
}

export function answersMatch(answer: number | null | undefined, expectedAnswer: number) {
  return answer != null && answer === expectedAnswer;
}

export function scoreFromAlignment(questionResults: AssessmentQuestionResultDto[]) {
  if (questionResults.length === 0) return 0;
  const aligned = questionResults.filter((question) => answersMatch(question.answer, question.expectedAnswer)).length;
  return Math.round((aligned / questionResults.length) * 100);
}

export function questionStatusFor(question: AssessmentQuestionResultDto) {
  if (question.answer == null) return { label: "Not answered", color: "default" as const };
  if (question.answer === question.expectedAnswer) return { label: "Aligned", color: "success" as const };
  if (question.answer === AnswerOption.Partial) return { label: "Partially aligned", color: "warning" as const };
  return { label: "Needs improvement", color: "error" as const };
}

export function buildCategoryGroups(
  questionResults: AssessmentQuestionResultDto[],
  scores: AssessmentScoreDto[],
): CategoryGroup[] {
  const categoryScores = new Map(scores.filter((s) => s.scope === ScoreScope.Category && s.categoryId).map((s) => [s.categoryId as string, Math.round(s.score)]));
  const moduleScores = new Map(scores.filter((s) => s.scope === ScoreScope.Module && s.moduleId).map((s) => [s.moduleId as string, Math.round(s.score)]));
  const subModuleScores = new Map(scores.filter((s) => s.scope === ScoreScope.SubModule && s.subModuleId).map((s) => [s.subModuleId as string, Math.round(s.score)]));

  const categoryMap = new Map<string, {
    categoryId: string;
    categoryName: string;
    questions: AssessmentQuestionResultDto[];
    modules: Map<string, {
      key: string;
      moduleId: string;
      moduleName: string;
      questions: AssessmentQuestionResultDto[];
      subModules: Map<string, { key: string; subModuleId: string; subModuleName: string; questions: AssessmentQuestionResultDto[] }>;
    }>;
  }>();

  for (const question of questionResults) {
    let category = categoryMap.get(question.categoryId);
    if (!category) {
      category = { categoryId: question.categoryId, categoryName: question.categoryName, questions: [], modules: new Map() };
      categoryMap.set(question.categoryId, category);
    }
    category.questions.push(question);

    let module = category.modules.get(question.moduleId);
    if (!module) {
      module = { key: `${question.categoryId}:${question.moduleId}`, moduleId: question.moduleId, moduleName: question.moduleName, questions: [], subModules: new Map() };
      category.modules.set(question.moduleId, module);
    }
    module.questions.push(question);

    let subModule = module.subModules.get(question.subModuleId);
    if (!subModule) {
      subModule = { key: `${question.categoryId}:${question.moduleId}:${question.subModuleId}`, subModuleId: question.subModuleId, subModuleName: question.subModuleName, questions: [] };
      module.subModules.set(question.subModuleId, subModule);
    }
    subModule.questions.push(question);
  }

  return Array.from(categoryMap.values()).map((category) => {
    const categoryScore = categoryScores.get(category.categoryId) ?? scoreFromAlignment(category.questions);
    const modules = Array.from(category.modules.values()).map((module) => {
      const score = moduleScores.get(module.moduleId) ?? scoreFromAlignment(module.questions);
      const subModules = Array.from(module.subModules.values()).map((subModule) => {
        const subModuleScore = subModuleScores.get(subModule.subModuleId) ?? scoreFromAlignment(subModule.questions);
        return {
          key: subModule.key,
          subModuleId: subModule.subModuleId,
          subModuleName: subModule.subModuleName,
          score: subModuleScore,
          stage: stageForScore(subModuleScore),
          answeredCount: subModule.questions.filter((q) => q.answer != null).length,
          questionCount: subModule.questions.length,
          alignedCount: subModule.questions.filter((q) => answersMatch(q.answer, q.expectedAnswer)).length,
          questions: subModule.questions,
        } satisfies SubModuleGroup;
      });
      return {
        key: module.key,
        moduleId: module.moduleId,
        moduleName: module.moduleName,
        score,
        stage: stageForScore(score),
        answeredCount: module.questions.filter((q) => q.answer != null).length,
        questionCount: module.questions.length,
        alignedCount: module.questions.filter((q) => answersMatch(q.answer, q.expectedAnswer)).length,
        subModules,
      } satisfies ModuleGroup;
    });
    return {
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      score: categoryScore,
      stage: stageForScore(categoryScore),
      answeredCount: category.questions.filter((q) => q.answer != null).length,
      questionCount: category.questions.length,
      alignedCount: category.questions.filter((q) => answersMatch(q.answer, q.expectedAnswer)).length,
      modules,
    } satisfies CategoryGroup;
  });
}

/* ------------------------------------------------------------------ *
 * Executive KPIs
 * ------------------------------------------------------------------ */
export interface Kpi {
  key: string;
  label: string;
  value: string;
  numeric?: number;
  delta?: number;
  deltaSuffix?: string;
  sub: string;
  accent: string;
  sparkline?: number[];
}

export function averageScore(groups: CategoryGroup[]) {
  if (groups.length === 0) return 0;
  return Math.round(groups.reduce((sum, g) => sum + g.score, 0) / groups.length);
}

export function highestCategory(groups: CategoryGroup[]) {
  return groups.slice().sort((a, b) => b.score - a.score)[0];
}

export function lowestCategory(groups: CategoryGroup[]) {
  return groups.slice().sort((a, b) => a.score - b.score)[0];
}

export function readinessIndex(groups: CategoryGroup[]) {
  if (groups.length === 0) return 0;
  return Math.round((groups.filter((g) => g.stage.level >= 4).length / groups.length) * 100);
}

export function buildKpis(
  overallScore: number,
  completion: number,
  groups: CategoryGroup[],
  previousScore: number | null,
  history: number[],
): Kpi[] {
  const avg = averageScore(groups);
  const best = highestCategory(groups);
  const worst = lowestCategory(groups);
  const stage = stageForScore(overallScore);
  const readiness = readinessIndex(groups);
  const delta = previousScore == null ? undefined : overallScore - previousScore;

  return [
    { key: "overall", label: "Overall score", value: `${overallScore}/100`, numeric: overallScore, delta, deltaSuffix: " pts", sub: `${stage.label} maturity stage`, accent: stage.color, sparkline: history },
    { key: "avg", label: "Avg competency score", value: `${avg}/100`, numeric: avg, sub: `Across ${groups.length} competencies`, accent: brandTokens.blue600 },
    { key: "best", label: "Highest performing area", value: best ? `${best.score}` : "--", sub: best ? best.categoryName : "No data", accent: semanticTokens.successMain },
    { key: "worst", label: "Lowest performing area", value: worst ? `${worst.score}` : "--", sub: worst ? worst.categoryName : "No data", accent: semanticTokens.errorMain },
    { key: "completion", label: "Completion", value: `${Math.round(completion)}%`, numeric: Math.round(completion), sub: "Of assigned questions answered", accent: dataTokens.bandQE },
    { key: "maturity", label: "Maturity level", value: `${stage.level}/5`, numeric: stage.level, sub: stage.label, accent: stage.color },
    { key: "readiness", label: "Readiness index", value: `${readiness}%`, numeric: readiness, sub: "Competencies at Managed+ stage", accent: readiness >= 60 ? semanticTokens.successMain : readiness >= 30 ? semanticTokens.warningMain : semanticTokens.errorMain },
  ];
}

/* ------------------------------------------------------------------ *
 * Chart datasets
 * ------------------------------------------------------------------ */
export interface RadarDatum {
  category: string;
  categoryId: string;
  score: number;
}
export function radarData(groups: CategoryGroup[]): RadarDatum[] {
  return groups.map((g) => ({ category: shortLabel(g.categoryName), categoryId: g.categoryId, score: g.score }));
}

export interface RankingDatum {
  categoryId: string;
  category: string;
  score: number;
  color: string;
}
export function rankingData(groups: CategoryGroup[]): RankingDatum[] {
  return groups
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((g) => ({ categoryId: g.categoryId, category: shortLabel(g.categoryName), score: g.score, color: g.stage.color }));
}

export interface AlignmentDatum {
  categoryId: string;
  category: string;
  Aligned: number;
  Partial: number;
  "Needs improvement": number;
  "Not answered": number;
}
export function alignmentData(groups: CategoryGroup[]): AlignmentDatum[] {
  return groups.map((g) => {
    const questions = g.modules.flatMap((m) => m.subModules.flatMap((s) => s.questions));
    let aligned = 0;
    let partial = 0;
    let needs = 0;
    let unanswered = 0;
    for (const q of questions) {
      if (q.answer == null) unanswered += 1;
      else if (q.answer === q.expectedAnswer) aligned += 1;
      else if (q.answer === AnswerOption.Partial) partial += 1;
      else needs += 1;
    }
    return {
      categoryId: g.categoryId,
      category: shortLabel(g.categoryName),
      Aligned: aligned,
      Partial: partial,
      "Needs improvement": needs,
      "Not answered": unanswered,
    };
  });
}

export const alignmentColors: Record<string, string> = {
  Aligned: semanticTokens.successMain,
  Partial: semanticTokens.warningMain,
  "Needs improvement": semanticTokens.errorMain,
  "Not answered": "#C7C7CC",
};

export interface HeatCell {
  key: string;
  moduleName: string;
  score: number;
  color: string;
  stageLabel: string;
}
export interface HeatRow {
  categoryId: string;
  categoryName: string;
  cells: HeatCell[];
}
export function heatmapData(groups: CategoryGroup[]): HeatRow[] {
  return groups.map((g) => ({
    categoryId: g.categoryId,
    categoryName: g.categoryName,
    cells: g.modules.map((m) => ({ key: m.key, moduleName: m.moduleName, score: m.score, color: m.stage.color, stageLabel: m.stage.label })),
  }));
}

export interface DistributionDatum {
  name: string;
  value: number;
  color: string;
  percent: number;
}
export function stageDistribution(groups: CategoryGroup[]): DistributionDatum[] {
  const total = groups.length || 1;
  return STAGES.map((stage) => {
    const value = groups.filter((g) => g.stage.level === stage.level).length;
    return { name: stage.label, value, color: stage.color, percent: Math.round((value / total) * 100) };
  }).filter((d) => d.value > 0);
}

export function answerDistribution(questionResults: AssessmentQuestionResultDto[]): DistributionDatum[] {
  const total = questionResults.length || 1;
  let yes = 0;
  let partial = 0;
  let no = 0;
  let unanswered = 0;
  for (const q of questionResults) {
    if (q.answer == null) unanswered += 1;
    else if (q.answer === AnswerOption.Yes) yes += 1;
    else if (q.answer === AnswerOption.Partial) partial += 1;
    else no += 1;
  }
  return [
    { name: "Yes", value: yes, color: dataTokens.answerYes, percent: Math.round((yes / total) * 100) },
    { name: "Partial", value: partial, color: dataTokens.answerPartial, percent: Math.round((partial / total) * 100) },
    { name: "No", value: no, color: dataTokens.answerNo, percent: Math.round((no / total) * 100) },
    { name: "Not answered", value: unanswered, color: "#C7C7CC", percent: Math.round((unanswered / total) * 100) },
  ].filter((d) => d.value > 0);
}

/* ------------------------------------------------------------------ *
 * Insights (generated from real data - heuristic, labelled as such)
 * ------------------------------------------------------------------ */
export type InsightTone = "positive" | "warning" | "critical" | "info";
export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
}

export function buildInsights(groups: CategoryGroup[], overallDelta: number | null): Insight[] {
  if (groups.length === 0) return [];
  const insights: Insight[] = [];
  const sorted = groups.slice().sort((a, b) => b.score - a.score);
  const mean = averageScore(groups);

  const strongest = sorted[0];
  if (strongest) {
    insights.push({
      id: "strength",
      tone: "positive",
      title: "Top strength",
      body: `${strongest.categoryName} leads at ${strongest.score}/100 (${strongest.stage.label}). Protect this and use it as a model for weaker areas.`,
    });
  }

  const weakest = sorted[sorted.length - 1];
  if (weakest && weakest.categoryId !== strongest?.categoryId) {
    const gap = mean - weakest.score;
    insights.push({
      id: "weak",
      tone: weakest.stage.level <= 2 ? "critical" : "warning",
      title: "Weakest competency",
      body: `${weakest.categoryName} is your lowest area at ${weakest.score}/100${gap > 0 ? `, ${Math.round(gap)} points below your own average` : ""}. Prioritise improvement here.`,
    });
  }

  const atRisk = groups.filter((g) => g.stage.level <= 2);
  if (atRisk.length > 0) {
    insights.push({
      id: "risk",
      tone: "critical",
      title: `${atRisk.length} area${atRisk.length > 1 ? "s" : ""} at risk`,
      body: `${atRisk.map((g) => g.categoryName).slice(0, 3).join(", ")}${atRisk.length > 3 ? "..." : ""} sit at Immature/Developing maturity and need attention first.`,
    });
  }

  const highPerforming = groups.filter((g) => g.stage.level >= 4);
  if (highPerforming.length > 0) {
    insights.push({
      id: "high",
      tone: "positive",
      title: `${highPerforming.length} high-performing area${highPerforming.length > 1 ? "s" : ""}`,
      body: `${highPerforming.map((g) => g.categoryName).slice(0, 3).join(", ")} reached Managed maturity or higher - reliable strengths to build on.`,
    });
  }

  // Outlier: competency furthest from the mean.
  const outlier = groups.slice().sort((a, b) => Math.abs(b.score - mean) - Math.abs(a.score - mean))[0];
  if (outlier && Math.abs(outlier.score - mean) >= 20) {
    const above = outlier.score > mean;
    insights.push({
      id: "outlier",
      tone: above ? "info" : "warning",
      title: "Notable outlier",
      body: `${outlier.categoryName} stands out ${above ? "above" : "below"} the rest at ${outlier.score}/100 (${Math.abs(Math.round(outlier.score - mean))} points ${above ? "above" : "below"} average).`,
    });
  }

  if (overallDelta != null && overallDelta !== 0) {
    insights.push({
      id: "trend",
      tone: overallDelta > 0 ? "positive" : "critical",
      title: overallDelta > 0 ? "Improving trend" : "Declining trend",
      body: `Overall score ${overallDelta > 0 ? "rose" : "fell"} ${Math.abs(overallDelta)} points versus your previous assessment.`,
    });
  }

  return insights;
}

/* ------------------------------------------------------------------ *
 * Recommendations - enrich real records, or derive from weak areas
 * ------------------------------------------------------------------ */
export type PriorityLabel = "Critical" | "High" | "Medium" | "Low";
export const priorityOrder: Record<PriorityLabel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
export const priorityColor: Record<PriorityLabel, string> = {
  Critical: semanticTokens.errorMain,
  High: semanticTokens.warningMain,
  Medium: brandTokens.blue600,
  Low: semanticTokens.successMain,
};
export const priorityWindow: Record<PriorityLabel, string> = {
  Critical: "Immediate action required",
  High: "Recommended within 30 days",
  Medium: "Recommended within 90 days",
  Low: "Long-term improvement",
};

export interface EnrichedRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: PriorityLabel;
  impact: "High" | "Medium" | "Low";
  effort: "High" | "Medium" | "Low";
  expectedImprovement: string;
  suggestedTraining: string;
}

function targetForStage(level: number) {
  return Math.min(100, level >= 5 ? 100 : level * 20 + 5);
}

export function buildRecommendations(
  recommendations: RecommendationDto[],
  groups: CategoryGroup[],
): EnrichedRecommendation[] {
  const byCategory = new Map(groups.map((g) => [g.categoryId, g]));
  const byName = new Map(groups.map((g) => [g.categoryName.toLowerCase(), g]));

  const enriched: EnrichedRecommendation[] = recommendations.map((rec) => {
    const group = (rec.categoryId && byCategory.get(rec.categoryId)) || (rec.categoryName && byName.get(rec.categoryName.toLowerCase())) || undefined;
    const priority = priorityLabel[rec.priority] ?? "Low";
    const categoryName = rec.categoryName ?? rec.moduleName ?? group?.categoryName ?? "Overall";
    return enrichOne(rec.recommendationId, rec.title, rec.description || rec.title, categoryName, priority, group);
  });

  if (enriched.length > 0) return enriched.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Fallback: derive from the weakest competencies when the API returned none.
  return groups
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((group) => {
      const priority: PriorityLabel = group.stage.level <= 1 ? "Critical" : group.stage.level <= 2 ? "High" : group.stage.level <= 3 ? "Medium" : "Low";
      return enrichOne(
        `derived-${group.categoryId}`,
        `Strengthen ${group.categoryName}`,
        `${group.categoryName} is at ${group.score}/100 (${group.stage.label}). Focus on the lowest-aligned modules to raise this competency to the next maturity stage.`,
        group.categoryName,
        priority,
        group,
      );
    });
}

function enrichOne(
  id: string,
  title: string,
  description: string,
  category: string,
  priority: PriorityLabel,
  group: CategoryGroup | undefined,
): EnrichedRecommendation {
  const current = group?.score ?? 0;
  const target = group ? targetForStage(group.stage.level) : Math.min(100, current + 15);
  const gap = Math.max(0, target - current);
  const impact = priority === "Critical" ? "High" : priority === "High" ? "High" : priority === "Medium" ? "Medium" : "Low";
  const questionCount = group?.questionCount ?? 0;
  const effort = questionCount >= 20 ? "High" : questionCount >= 8 ? "Medium" : "Low";
  return {
    id,
    title,
    description,
    category,
    priority,
    impact,
    effort,
    expectedImprovement: group ? `+${gap} pts to reach ${target}/100` : "Improves overall maturity",
    suggestedTraining: `Targeted ${category} enablement & coaching`,
  };
}

/* ------------------------------------------------------------------ *
 * Improvement opportunities (current -> target, gap, trend)
 * ------------------------------------------------------------------ */
export interface Opportunity {
  categoryId: string;
  categoryName: string;
  current: number;
  target: number;
  gap: number;
  stage: StageInfo;
  suggestedActions: string;
}
export function buildOpportunities(groups: CategoryGroup[]): Opportunity[] {
  return groups
    .filter((g) => g.stage.level <= 3)
    .sort((a, b) => a.score - b.score)
    .slice(0, 6)
    .map((g) => {
      const target = targetForStage(g.stage.level);
      const weakModule = g.modules.slice().sort((a, b) => a.score - b.score)[0];
      return {
        categoryId: g.categoryId,
        categoryName: g.categoryName,
        current: g.score,
        target,
        gap: Math.max(0, target - g.score),
        stage: g.stage,
        suggestedActions: weakModule ? `Start with "${weakModule.moduleName}" (${weakModule.score}/100), the weakest module in this area.` : "Review the misaligned answers in this competency.",
      };
    });
}

/* ------------------------------------------------------------------ *
 * Risk analysis
 * ------------------------------------------------------------------ */
export type RiskLevel = "High" | "Medium" | "Low";
export interface RiskArea {
  id: string;
  name: string;
  score: number;
  level: RiskLevel;
}
export const riskColor: Record<RiskLevel, string> = {
  High: semanticTokens.errorMain,
  Medium: semanticTokens.warningMain,
  Low: semanticTokens.successMain,
};
export function riskLevelFor(stageLevel: number): RiskLevel {
  if (stageLevel <= 2) return "High";
  if (stageLevel === 3) return "Medium";
  return "Low";
}
export interface RiskAnalysis {
  areas: RiskArea[];
  modules: RiskArea[];
  performanceDecline: boolean;
  declineAmount: number;
}
export function buildRiskAnalysis(groups: CategoryGroup[], overallDelta: number | null): RiskAnalysis {
  const areas: RiskArea[] = groups
    .map((g) => ({ id: g.categoryId, name: g.categoryName, score: g.score, level: riskLevelFor(g.stage.level) }))
    .sort((a, b) => a.score - b.score);
  const modules: RiskArea[] = groups
    .flatMap((g) => g.modules)
    .filter((m) => m.stage.level <= 2)
    .map((m) => ({ id: m.key, name: m.moduleName, score: m.score, level: riskLevelFor(m.stage.level) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 8);
  return {
    areas,
    modules,
    performanceDecline: overallDelta != null && overallDelta < 0,
    declineAmount: overallDelta != null && overallDelta < 0 ? Math.abs(overallDelta) : 0,
  };
}

/* ------------------------------------------------------------------ *
 * Benchmark comparison (this vs your average vs previous vs target)
 * ------------------------------------------------------------------ */
export interface BenchmarkDatum {
  label: string;
  score: number;
  color: string;
}
export function buildBenchmark(
  overallScore: number,
  yourAverage: number | null,
  previousScore: number | null,
): BenchmarkDatum[] {
  const data: BenchmarkDatum[] = [{ label: "This assessment", score: overallScore, color: stageForScore(overallScore).color }];
  if (previousScore != null) data.push({ label: "Previous assessment", score: previousScore, color: dataTokens.bandQE });
  if (yourAverage != null) data.push({ label: "Your average", score: yourAverage, color: brandTokens.blue600 });
  data.push({ label: "Target (Optimized)", score: 85, color: "#C7C7CC" });
  return data;
}

/* ------------------------------------------------------------------ *
 * Trend + history helpers
 * ------------------------------------------------------------------ */
export interface TrendPoint {
  label: string;
  score: number;
  completion: number;
}

export function resolveDate(assessment: AssessmentSummaryDto) {
  return assessment.scoredAtUtc ?? assessment.submittedAtUtc ?? assessment.startedAtUtc ?? assessment.createdAtUtc;
}

/** History of the same assessment type (by title), oldest to newest. */
export function sameTypeHistory(history: AssessmentSummaryDto[], current: AssessmentSummaryDto) {
  return history
    .filter((a) => a.title === current.title)
    .slice()
    .sort((a, b) => new Date(resolveDate(a)).getTime() - new Date(resolveDate(b)).getTime());
}

export function trendData(history: AssessmentSummaryDto[], current: AssessmentSummaryDto): TrendPoint[] {
  return sameTypeHistory(history, current).map((a) => ({
    label: formatShortDate(resolveDate(a)),
    score: Math.round(a.overallScore ?? 0),
    completion: Math.round(a.completionPercentage ?? 0),
  }));
}

export function previousScoreFor(history: AssessmentSummaryDto[], current: AssessmentSummaryDto): number | null {
  const chain = sameTypeHistory(history, current);
  const index = chain.findIndex((a) => a.assessmentId === current.assessmentId);
  if (index > 0) return Math.round(chain[index - 1].overallScore ?? 0);
  return null;
}

export function averageOverall(history: AssessmentSummaryDto[]): number | null {
  const scored = history.filter((a) => a.overallScore != null);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((sum, a) => sum + (a.overallScore ?? 0), 0) / scored.length);
}

export function historyScores(history: AssessmentSummaryDto[], current: AssessmentSummaryDto): number[] {
  return sameTypeHistory(history, current).map((a) => Math.round(a.overallScore ?? 0));
}

/* ------------------------------------------------------------------ *
 * Small formatting helpers
 * ------------------------------------------------------------------ */
export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "2-digit" }).format(new Date(value));
}

function shortLabel(value: string) {
  return value.length > 22 ? `${value.slice(0, 21)}...` : value;
}
