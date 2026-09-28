export const ASSESSMENT_LINK_NAVIGATION_SOURCE = "identity-link" as const;
export const PUBLIC_ASSESSMENT_NAVIGATION_SOURCE = "public" as const;
const FOCUSED_ASSESSMENT_SOURCES = [ASSESSMENT_LINK_NAVIGATION_SOURCE, PUBLIC_ASSESSMENT_NAVIGATION_SOURCE] as const;
const FOCUSED_ASSESSMENT_NAVIGATION_STORAGE_KEY = "qmri.focusedAssessmentNavigation";

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

export function persistFocusedAssessmentNavigation(state: unknown) {
  if (!isFocusedAssessmentNavigationState(state) || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FOCUSED_ASSESSMENT_NAVIGATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function getFocusedAssessmentNavigationState(state: unknown): NonNullable<AssessmentNavigationState> | null {
  if (isFocusedAssessmentNavigationState(state)) {
    return state;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(FOCUSED_ASSESSMENT_NAVIGATION_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed: unknown = JSON.parse(stored);
    return isFocusedAssessmentNavigationState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearFocusedAssessmentNavigation() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(FOCUSED_ASSESSMENT_NAVIGATION_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}
