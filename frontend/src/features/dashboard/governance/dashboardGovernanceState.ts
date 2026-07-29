import type { AssessmentSummaryDto } from "shared/api/types";

export interface ScoringPolicySettings {
  pillarWeights: {
    technology: number;
    operatingModel: number;
    process: number;
    people: number;
  };
  passMark: number;
  recommendationBands: {
    lowMax: number;
    mediumMax: number;
  };
  updatedAtUtc?: string;
}

export interface IntensityTemplate {
  code: "Operational" | "Strategic" | "Tactical";
  label: string;
  minQuestions: number;
  maxQuestions: number;
  lockedRange: boolean;
  description: string;
}

export interface IntensityTemplateSettings {
  templates: IntensityTemplate[];
  defaultTemplateCode: IntensityTemplate["code"];
  updatedAtUtc?: string;
}

export interface GovernanceAuditEntry {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityName: string;
  details?: string;
  happenedAtUtc: string;
}

export interface ResumePointer {
  assessmentId: string;
  subModuleId: string;
  questionId?: string;
  touchedAtUtc: string;
}

export interface ReminderPreferences {
  enabled: boolean;
  remindBeforeDays: number;
  defaultDueInDays: number;
}


const SCORING_POLICY_KEY = "qmri.dashboard.scoringPolicy";
const INTENSITY_TEMPLATE_KEY = "qmri.dashboard.intensityTemplates";
const AUDIT_FEED_KEY = "qmri.dashboard.governanceAudit";
const REMINDER_PREFERENCES_KEY = "qmri.dashboard.reminderPreferences";

const DEFAULT_SCORING_POLICY: ScoringPolicySettings = {
  pillarWeights: {
    technology: 25,
    operatingModel: 25,
    process: 25,
    people: 25,
  },
  passMark: 70,
  recommendationBands: {
    lowMax: 50,
    mediumMax: 75,
  },
};

const DEFAULT_INTENSITY_TEMPLATES: IntensityTemplate[] = [
  {
    code: "Operational",
    label: "Operational (Low difficulty)",
    minQuestions: 30,
    maxQuestions: 40,
    lockedRange: true,
    description: "Focused operational readiness baseline with lower-difficulty core questions.",
  },
  {
    code: "Strategic",
    label: "Strategic (High difficulty)",
    minQuestions: 100,
    maxQuestions: 100,
    lockedRange: true,
    description: "Enterprise-level strategic capability assessment with the highest-difficulty questions.",
  },
  {
    code: "Tactical",
    label: "Tactical (Medium difficulty)",
    minQuestions: 300,
    maxQuestions: 300,
    lockedRange: true,
    description: "Detailed tactical depth assessment with medium-difficulty questions.",
  },
];

const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  enabled: true,
  remindBeforeDays: 3,
  defaultDueInDays: 14,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function userScopedKey(prefix: string, userId?: string | null) {
  return `${prefix}:${userId ?? "anonymous"}`;
}

export function loadScoringPolicySettings(): ScoringPolicySettings {
  const stored = readJson<Partial<ScoringPolicySettings>>(SCORING_POLICY_KEY, {});

  return {
    pillarWeights: {
      technology: clampNumber(stored.pillarWeights?.technology ?? DEFAULT_SCORING_POLICY.pillarWeights.technology, 0, 100),
      operatingModel: clampNumber(stored.pillarWeights?.operatingModel ?? DEFAULT_SCORING_POLICY.pillarWeights.operatingModel, 0, 100),
      process: clampNumber(stored.pillarWeights?.process ?? DEFAULT_SCORING_POLICY.pillarWeights.process, 0, 100),
      people: clampNumber(stored.pillarWeights?.people ?? DEFAULT_SCORING_POLICY.pillarWeights.people, 0, 100),
    },
    passMark: clampNumber(stored.passMark ?? DEFAULT_SCORING_POLICY.passMark, 0, 100),
    recommendationBands: {
      lowMax: clampNumber(stored.recommendationBands?.lowMax ?? DEFAULT_SCORING_POLICY.recommendationBands.lowMax, 1, 99),
      mediumMax: clampNumber(stored.recommendationBands?.mediumMax ?? DEFAULT_SCORING_POLICY.recommendationBands.mediumMax, 1, 99),
    },
    updatedAtUtc: stored.updatedAtUtc,
  };
}

export function saveScoringPolicySettings(settings: ScoringPolicySettings) {
  writeJson(SCORING_POLICY_KEY, {
    ...settings,
    updatedAtUtc: new Date().toISOString(),
  });
}

export function totalPillarWeight(settings: ScoringPolicySettings) {
  return (
    settings.pillarWeights.technology +
    settings.pillarWeights.operatingModel +
    settings.pillarWeights.process +
    settings.pillarWeights.people
  );
}

export function loadIntensityTemplateSettings(): IntensityTemplateSettings {
  const stored = readJson<Partial<IntensityTemplateSettings>>(INTENSITY_TEMPLATE_KEY, {});
  const storedTemplates = stored.templates?.length ? stored.templates : DEFAULT_INTENSITY_TEMPLATES;

  const templates = DEFAULT_INTENSITY_TEMPLATES.map((defaultTemplate) => {
    const existing = storedTemplates.find((template) => template.code === defaultTemplate.code);

    if (!existing) {
      return defaultTemplate;
    }

    const storedMinQuestions = Math.floor(existing.minQuestions);
    const minQuestions = defaultTemplate.code === "Operational"
      ? defaultTemplate.minQuestions
      : Number.isFinite(storedMinQuestions)
        ? Math.max(1, storedMinQuestions)
        : defaultTemplate.minQuestions;
    const storedMaxQuestions = Math.floor(existing.maxQuestions);
    const maxQuestions = Number.isFinite(storedMaxQuestions)
      ? Math.max(minQuestions, storedMaxQuestions)
      : Math.max(minQuestions, defaultTemplate.maxQuestions);

    return {
      ...existing,
      ...defaultTemplate,
      minQuestions,
      maxQuestions,
      lockedRange: existing.lockedRange ?? defaultTemplate.lockedRange,
    };
  });

  return {
    templates,
    defaultTemplateCode: stored.defaultTemplateCode ?? "Operational",
    updatedAtUtc: stored.updatedAtUtc,
  };
}

export function saveIntensityTemplateSettings(settings: IntensityTemplateSettings) {
  writeJson(INTENSITY_TEMPLATE_KEY, {
    ...settings,
    updatedAtUtc: new Date().toISOString(),
  });
}

export function findIntensityTemplate(code?: IntensityTemplate["code"] | null) {
  const settings = loadIntensityTemplateSettings();
  return settings.templates.find((template) => template.code === code) ?? null;
}
function createAuditId() {
  const cryptoApi = globalThis.crypto;

  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues === "function") {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  return `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadGovernanceAuditFeed(): GovernanceAuditEntry[] {
  const entries = readJson<GovernanceAuditEntry[]>(AUDIT_FEED_KEY, []);
  return entries
    .slice()
    .sort((left, right) => new Date(right.happenedAtUtc).getTime() - new Date(left.happenedAtUtc).getTime());
}

export function appendGovernanceAuditEntry(entry: Omit<GovernanceAuditEntry, "id" | "happenedAtUtc"> & { happenedAtUtc?: string }) {
  const existing = loadGovernanceAuditFeed();

  const next: GovernanceAuditEntry = {
    ...entry,
    id: createAuditId(),
    happenedAtUtc: entry.happenedAtUtc ?? new Date().toISOString(),
  };

  const merged = [next, ...existing].slice(0, 200);
  writeJson(AUDIT_FEED_KEY, merged);
}

export function clearGovernanceAuditFeed() {
  writeJson(AUDIT_FEED_KEY, [] as GovernanceAuditEntry[]);
}

export function loadReminderPreferences(): ReminderPreferences {
  const stored = readJson<Partial<ReminderPreferences>>(REMINDER_PREFERENCES_KEY, {});

  return {
    enabled: stored.enabled ?? DEFAULT_REMINDER_PREFERENCES.enabled,
    remindBeforeDays: clampNumber(stored.remindBeforeDays ?? DEFAULT_REMINDER_PREFERENCES.remindBeforeDays, 1, 30),
    defaultDueInDays: clampNumber(stored.defaultDueInDays ?? DEFAULT_REMINDER_PREFERENCES.defaultDueInDays, 1, 60),
  };
}

export function saveReminderPreferences(preferences: ReminderPreferences) {
  writeJson(REMINDER_PREFERENCES_KEY, preferences);
}

export function resolveDueDate(assessment: AssessmentSummaryDto, dueInDays = DEFAULT_REMINDER_PREFERENCES.defaultDueInDays) {
  const baseDate = assessment.startedAtUtc ?? assessment.createdAtUtc;
  const date = new Date(baseDate);

  date.setDate(date.getDate() + dueInDays);
  return date.toISOString();
}

export function loadResumePointer(userId?: string | null): ResumePointer | null {
  return readJson<ResumePointer | null>(userScopedKey("qmri.dashboard.resumePointer", userId), null);
}

export function saveResumePointer(userId: string | undefined, pointer: ResumePointer) {
  if (!userId) {
    return;
  }

  writeJson(userScopedKey("qmri.dashboard.resumePointer", userId), {
    ...pointer,
    touchedAtUtc: new Date().toISOString(),
  });
}

export function clearResumePointer(userId: string | undefined) {
  if (!userId) {
    return;
  }

  localStorage.removeItem(userScopedKey("qmri.dashboard.resumePointer", userId));
}



