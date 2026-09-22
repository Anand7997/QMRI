export const ASSESSMENT_LINK_NAVIGATION_SOURCE = "identity-link" as const;
export const PUBLIC_ASSESSMENT_NAVIGATION_SOURCE = "public" as const;
const FOCUSED_ASSESSMENT_SOURCES = [ASSESSMENT_LINK_NAVIGATION_SOURCE, PUBLIC_ASSESSMENT_NAVIGATION_SOURCE] as const;

export type AssessmentNavigationState = {
  assessmentId?: string;
  resume?: boolean;
  source?: (typeof FOCUSED_ASSESSMENT_SOURCES)[number];
} | null;

export function isAssessmentLinkNavigationState(state: unknown): state is NonNullable<AssessmentNavigationState> {
  if (!state || typeof state !== "object") {
    return false;
  }

  const navigationState = state as { resume?: unknown; source?: unknown };
  return navigationState.resume === true && navigationState.source === ASSESSMENT_LINK_NAVIGATION_SOURCE;
}

export function isPublicAssessmentNavigationState(state: unknown): state is NonNullable<AssessmentNavigationState> {
  if (!state || typeof state !== "object") {
    return false;
  }

  const navigationState = state as { resume?: unknown; source?: unknown };
  return navigationState.resume === true && navigationState.source === PUBLIC_ASSESSMENT_NAVIGATION_SOURCE;
}

export function isFocusedAssessmentNavigationState(state: unknown): state is NonNullable<AssessmentNavigationState> {
  if (!state || typeof state !== "object") {
    return false;
  }

  const navigationState = state as { resume?: unknown; source?: unknown };
  return navigationState.resume === true
    && FOCUSED_ASSESSMENT_SOURCES.includes(navigationState.source as (typeof FOCUSED_ASSESSMENT_SOURCES)[number]);
}
