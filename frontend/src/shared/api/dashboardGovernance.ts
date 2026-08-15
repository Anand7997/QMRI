import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "./axiosClient";

export interface DashboardScoringPolicyDto {
  pillarWeights: DashboardPillarWeightsDto;
  passMark: number;
  recommendationBands: DashboardRecommendationBandsDto;
  updatedAtUtc?: string | null;
}

export interface DashboardPillarWeightsDto {
  technology: number;
  operatingModel: number;
  process: number;
  people: number;
}

export interface DashboardRecommendationBandsDto {
  lowMax: number;
  mediumMax: number;
}

export interface DashboardIntensityTemplateSettingsDto {
  templates: DashboardIntensityTemplateDto[];
  defaultTemplateCode: DashboardIntensityTemplateCode;
  updatedAtUtc?: string | null;
}

export type DashboardIntensityTemplateCode = "Operational" | "Strategic" | "Tactical";

export interface DashboardIntensityTemplateDto {
  code: DashboardIntensityTemplateCode;
  label: string;
  minQuestions: number;
  maxQuestions: number;
  lockedRange: boolean;
  description: string;
}

export interface DashboardReminderPreferencesDto {
  enabled: boolean;
  remindBeforeDays: number;
  defaultDueInDays: number;
  updatedAtUtc?: string | null;
}

export interface DashboardResumePointerDto {
  assessmentId: string;
  subModuleId: string;
  questionId?: string | null;
  touchedAtUtc: string;
}

export interface GovernanceAuditEntryDto {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityName: string;
  details?: string | null;
  happenedAtUtc: string;
}

export interface CreateGovernanceAuditEntryRequest {
  actor: string;
  action: string;
  entityType: string;
  entityName: string;
  details?: string | null;
  happenedAtUtc?: string | null;
}

export interface UpsertDashboardResumePointerRequest {
  assessmentId: string;
  subModuleId: string;
  questionId?: string | null;
  touchedAtUtc: string;
}

const DEFAULT_SCORING_POLICY: DashboardScoringPolicyDto = {
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
  updatedAtUtc: null,
};

const DEFAULT_INTENSITY_TEMPLATES: DashboardIntensityTemplateSettingsDto = {
  defaultTemplateCode: "Operational",
  templates: [
    {
      code: "Operational",
      label: "Operational (Low difficulty)",
      minQuestions: 15,
      maxQuestions: 16,
      lockedRange: true,
      description: "Focused operational readiness baseline with the balanced 16-question diagnostic set.",
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
  ],
  updatedAtUtc: null,
};

const DEFAULT_REMINDER_PREFERENCES: DashboardReminderPreferencesDto = {
  enabled: true,
  remindBeforeDays: 3,
  defaultDueInDays: 14,
  updatedAtUtc: null,
};

const keys = {
  scoringPolicy: ["dashboard-governance", "scoring-policy"] as const,
  intensityTemplates: ["dashboard-governance", "intensity-templates"] as const,
  reminderPreferences: (userId: string | null | undefined) => ["dashboard-governance", "reminder-preferences", userId ?? "me"] as const,
  resumePointer: (userId: string | null | undefined) => ["dashboard-governance", "resume-pointer", userId ?? "me"] as const,
  auditFeed: (limit: number) => ["dashboard-governance", "audit-feed", limit] as const,
};

export function defaultScoringPolicy() {
  return DEFAULT_SCORING_POLICY;
}

export function defaultIntensityTemplateSettings() {
  return DEFAULT_INTENSITY_TEMPLATES;
}

export function defaultReminderPreferences() {
  return DEFAULT_REMINDER_PREFERENCES;
}

export async function getScoringPolicySettings() {
  const { data } = await axiosClient.get<DashboardScoringPolicyDto>("/dashboard-governance/scoring-policy");
  return data;
}

export async function saveScoringPolicySettings(request: DashboardScoringPolicyDto) {
  const { data } = await axiosClient.put<DashboardScoringPolicyDto>("/dashboard-governance/scoring-policy", request);
  return data;
}

export function useScoringPolicySettings() {
  return useQuery({
    queryKey: keys.scoringPolicy,
    queryFn: getScoringPolicySettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveScoringPolicySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveScoringPolicySettings,
    onSuccess: (data) => {
      queryClient.setQueryData(keys.scoringPolicy, data);
      queryClient.invalidateQueries({ queryKey: keys.auditFeed(200) });
    },
  });
}

export async function getIntensityTemplateSettings() {
  const { data } = await axiosClient.get<DashboardIntensityTemplateSettingsDto>("/dashboard-governance/intensity-templates");
  return data;
}

export async function saveIntensityTemplateSettings(request: DashboardIntensityTemplateSettingsDto) {
  const { data } = await axiosClient.put<DashboardIntensityTemplateSettingsDto>("/dashboard-governance/intensity-templates", request);
  return data;
}

export function useIntensityTemplateSettings() {
  return useQuery({
    queryKey: keys.intensityTemplates,
    queryFn: getIntensityTemplateSettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveIntensityTemplateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveIntensityTemplateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(keys.intensityTemplates, data);
      queryClient.invalidateQueries({ queryKey: keys.auditFeed(200) });
    },
  });
}

export async function getGovernanceAuditFeed(limit = 200) {
  const { data } = await axiosClient.get<GovernanceAuditEntryDto[]>("/dashboard-governance/audit-feed", {
    params: { limit },
  });
  return data;
}

export async function appendGovernanceAuditEntry(request: CreateGovernanceAuditEntryRequest) {
  const { data } = await axiosClient.post<GovernanceAuditEntryDto>("/dashboard-governance/audit-feed", request);
  return data;
}

export async function clearGovernanceAuditFeed() {
  await axiosClient.delete("/dashboard-governance/audit-feed");
}

export function useGovernanceAuditFeed(limit = 200) {
  return useQuery({
    queryKey: keys.auditFeed(limit),
    queryFn: () => getGovernanceAuditFeed(limit),
    staleTime: 30_000,
  });
}

export function useAppendGovernanceAuditEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appendGovernanceAuditEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.auditFeed(200) });
    },
  });
}

export function useClearGovernanceAuditFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearGovernanceAuditFeed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.auditFeed(200) });
    },
  });
}

export async function getReminderPreferences() {
  const { data } = await axiosClient.get<DashboardReminderPreferencesDto>("/dashboard-governance/reminder-preferences");
  return data;
}

export async function saveReminderPreferences(request: DashboardReminderPreferencesDto) {
  const { data } = await axiosClient.put<DashboardReminderPreferencesDto>("/dashboard-governance/reminder-preferences", request);
  return data;
}

export function useReminderPreferences(userId: string | null | undefined) {
  return useQuery({
    queryKey: keys.reminderPreferences(userId),
    queryFn: getReminderPreferences,
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveReminderPreferences(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveReminderPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(keys.reminderPreferences(userId), data);
    },
  });
}

export async function getResumePointer() {
  const { data } = await axiosClient.get<DashboardResumePointerDto | null>("/dashboard-governance/resume-pointer");
  return data;
}

export async function saveResumePointer(request: UpsertDashboardResumePointerRequest) {
  const { data } = await axiosClient.put<DashboardResumePointerDto | null>("/dashboard-governance/resume-pointer", request);
  return data;
}

export async function clearResumePointer() {
  await axiosClient.delete("/dashboard-governance/resume-pointer");
}

export function useResumePointer(userId: string | null | undefined) {
  return useQuery({
    queryKey: keys.resumePointer(userId),
    queryFn: getResumePointer,
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function useSaveResumePointer(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveResumePointer,
    onSuccess: (data) => {
      queryClient.setQueryData(keys.resumePointer(userId), data);
    },
  });
}

export function useClearResumePointer(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearResumePointer,
    onSuccess: () => {
      queryClient.setQueryData(keys.resumePointer(userId), null);
    },
  });
}
