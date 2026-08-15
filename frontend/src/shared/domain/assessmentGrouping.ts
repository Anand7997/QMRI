import { AssessmentStatus, type AssessmentSummaryDto } from "shared/api/types";

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

export interface AssessmentAssignmentGroup {
  representative: AssessmentSummaryDto;
  assignedPeopleCount: number;
  takenPeopleCount: number;
}

export function groupAssessmentsByAssignment(assessments: AssessmentSummaryDto[]): AssessmentAssignmentGroup[] {
  const groups = new Map<string, AssessmentSummaryDto[]>();

  assessments.forEach((assessment) => {
    const key = buildAssessmentAssignmentKey(assessment);
    const group = groups.get(key) ?? [];
    group.push(assessment);
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .map((group) => {
      const representative = group
        .slice()
        .sort((left, right) => new Date(right.createdAtUtc).getTime() - new Date(left.createdAtUtc).getTime())[0];

      return {
        representative,
        assignedPeopleCount: group.length,
        takenPeopleCount: group.filter((assessment) => assessment.status >= AssessmentStatus.Submitted).length,
      };
    })
    .sort(
      (left, right) =>
        new Date(right.representative.createdAtUtc).getTime() - new Date(left.representative.createdAtUtc).getTime(),
    );
}

export function collapseAssessmentsByAssignment(assessments: AssessmentSummaryDto[]) {
  return groupAssessmentsByAssignment(assessments).map((group) => group.representative);
}
