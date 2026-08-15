import type { AssessmentSummaryDto } from "shared/api/types";
import type {
  DashboardIntensityTemplateCode,
  DashboardIntensityTemplateDto,
  DashboardIntensityTemplateSettingsDto,
  DashboardPillarWeightsDto,
} from "shared/api/dashboardGovernance";

export function totalPillarWeight(settings: { pillarWeights: DashboardPillarWeightsDto }) {
  return settings.pillarWeights.technology + settings.pillarWeights.operatingModel + settings.pillarWeights.process + settings.pillarWeights.people;
}

export function findIntensityTemplate(
  settings: DashboardIntensityTemplateSettingsDto,
  code?: DashboardIntensityTemplateCode | null,
): DashboardIntensityTemplateDto | null {
  return settings.templates.find((template) => template.code === code) ?? null;
}

export function resolveDueDate(assessment: AssessmentSummaryDto, dueInDays = 14) {
  const baseDate = assessment.startedAtUtc ?? assessment.createdAtUtc;
  const date = new Date(baseDate);

  date.setDate(date.getDate() + dueInDays);
  return date.toISOString();
}
