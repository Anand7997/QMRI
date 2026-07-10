import type { AssessmentSummaryDto } from "shared/api/types";

function normalizedParts(values: readonly string[]) {
  return [...values]
    .map((value) => value.trim().toLowerCase())
    .sort((left, right) => left.localeCompare(right))
    .join("|");
}

export function buildAssessmentAssignmentKey(assessment: AssessmentSummaryDto) {
  return [
    assessment.createdAtUtc,
    assessment.title.trim().toLowerCase(),
    (assessment.description ?? "").trim().toLowerCase(),
    assessment.scoringModelId ?? "",
    normalizedParts(assessment.departments),
    normalizedParts(assessment.questionIds),
  ].join("::");
}

export function collapseAssessmentsByAssignment(assessments: AssessmentSummaryDto[]) {
  const groups = new Map<string, AssessmentSummaryDto[]>();

  assessments.forEach((assessment) => {
    const key = buildAssessmentAssignmentKey(assessment);
    const group = groups.get(key) ?? [];
    group.push(assessment);
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .map((group) =>
      group
        .slice()
        .sort((left, right) => new Date(right.createdAtUtc).getTime() - new Date(left.createdAtUtc).getTime())[0],
    )
    .sort((left, right) => new Date(right.createdAtUtc).getTime() - new Date(left.createdAtUtc).getTime());
}
