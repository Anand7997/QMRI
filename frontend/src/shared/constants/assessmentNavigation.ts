export const ASSESSMENT_LINK_NAVIGATION_SOURCE = "identity-link" as const;

export type AssessmentNavigationState = {
  assessmentId?: string;
  resume?: boolean;
  source?: typeof ASSESSMENT_LINK_NAVIGATION_SOURCE;
} | null;

export function isAssessmentLinkNavigationState(state: unknown): state is NonNullable<AssessmentNavigationState> {
  if (!state || typeof state !== "object") {
    return false;
  }

  const navigationState = state as { resume?: unknown; source?: unknown };
  return navigationState.resume === true && navigationState.source === ASSESSMENT_LINK_NAVIGATION_SOURCE;
}
