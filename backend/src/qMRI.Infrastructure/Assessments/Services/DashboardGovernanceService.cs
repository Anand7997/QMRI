using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;
using qMRI.Domain.Assessments.Entities;
using qMRI.Infrastructure.Persistence;

namespace qMRI.Infrastructure.Assessments.Services;

public sealed class DashboardGovernanceService(qMRIDbContext dbContext) : IDashboardGovernanceService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private const string ScoringPolicyKey = "dashboard.scoring-policy";
    private const string IntensityTemplatesKey = "dashboard.intensity-templates";
    private const string ReminderPreferencesKey = "dashboard.reminder-preferences";
    private const string ResumePointerKey = "dashboard.resume-pointer";

    private static readonly DashboardScoringPolicyDto DefaultScoringPolicy = new()
    {
        PillarWeights = new DashboardPillarWeightsDto
        {
            Technology = 25,
            OperatingModel = 25,
            Process = 25,
            People = 25,
        },
        PassMark = 70,
        RecommendationBands = new DashboardRecommendationBandsDto
        {
            LowMax = 50,
            MediumMax = 75,
        },
    };

    private static readonly DashboardIntensityTemplateSettingsDto DefaultIntensityTemplateSettings = new()
    {
        DefaultTemplateCode = "Operational",
        Templates =
        [
            new DashboardIntensityTemplateDto
            {
                Code = "Operational",
                Label = "Operational (Low difficulty)",
                MinQuestions = 15,
                MaxQuestions = 16,
                LockedRange = true,
                Description = "Focused operational readiness baseline with the balanced 16-question diagnostic set.",
            },
            new DashboardIntensityTemplateDto
            {
                Code = "Strategic",
                Label = "Strategic (High difficulty)",
                MinQuestions = 100,
                MaxQuestions = 100,
                LockedRange = true,
                Description = "Enterprise-level strategic capability assessment with the highest-difficulty questions.",
            },
            new DashboardIntensityTemplateDto
            {
                Code = "Tactical",
                Label = "Tactical (Medium difficulty)",
                MinQuestions = 300,
                MaxQuestions = 300,
                LockedRange = true,
                Description = "Detailed tactical depth assessment with medium-difficulty questions.",
            },
        ],
    };

    private static readonly DashboardReminderPreferencesDto DefaultReminderPreferences = new()
    {
        Enabled = true,
        RemindBeforeDays = 3,
        DefaultDueInDays = 14,
    };

    public Task<DashboardScoringPolicyDto> GetScoringPolicyAsync(CancellationToken cancellationToken = default) =>
        GetSettingAsync(ScoringPolicyKey, DefaultScoringPolicy, cancellationToken);

    public async Task<DashboardScoringPolicyDto> UpsertScoringPolicyAsync(DashboardScoringPolicyDto request, CancellationToken cancellationToken = default)
    {
        var normalized = new DashboardScoringPolicyDto
        {
            PillarWeights = new DashboardPillarWeightsDto
            {
                Technology = Clamp(request.PillarWeights.Technology, 0, 100),
                OperatingModel = Clamp(request.PillarWeights.OperatingModel, 0, 100),
                Process = Clamp(request.PillarWeights.Process, 0, 100),
                People = Clamp(request.PillarWeights.People, 0, 100),
            },
            PassMark = Clamp(request.PassMark, 0, 100),
            RecommendationBands = new DashboardRecommendationBandsDto
            {
                LowMax = Clamp(request.RecommendationBands.LowMax, 1, 99),
                MediumMax = Clamp(request.RecommendationBands.MediumMax, 1, 99),
            },
        };

        if (normalized.RecommendationBands.LowMax >= normalized.RecommendationBands.MediumMax)
        {
            normalized.RecommendationBands.MediumMax = Math.Min(99, normalized.RecommendationBands.LowMax + 1);
        }

        await SaveSettingAsync(ScoringPolicyKey, normalized, null, cancellationToken);
        return normalized;
    }

    public Task<DashboardIntensityTemplateSettingsDto> GetIntensityTemplateSettingsAsync(CancellationToken cancellationToken = default) =>
        GetSettingAsync(IntensityTemplatesKey, DefaultIntensityTemplateSettings, cancellationToken);

    public async Task<DashboardIntensityTemplateSettingsDto> UpsertIntensityTemplateSettingsAsync(DashboardIntensityTemplateSettingsDto request, CancellationToken cancellationToken = default)
    {
        var defaults = DefaultIntensityTemplateSettings.Templates.ToDictionary(template => template.Code, StringComparer.OrdinalIgnoreCase);
        var templates = request.Templates
            .Select(template =>
            {
                if (!defaults.TryGetValue(template.Code, out var defaultTemplate))
                {
                    return new DashboardIntensityTemplateDto
                    {
                        Code = template.Code,
                        Label = template.Label,
                        MinQuestions = Math.Max(1, template.MinQuestions),
                        MaxQuestions = Math.Max(1, template.MaxQuestions),
                        LockedRange = template.LockedRange,
                        Description = template.Description,
                    };
                }

                var minQuestions = template.Code.Equals("Operational", StringComparison.OrdinalIgnoreCase)
                    ? defaultTemplate.MinQuestions
                    : Math.Max(1, template.MinQuestions);

                var maxQuestions = template.Code.Equals("Operational", StringComparison.OrdinalIgnoreCase)
                    ? defaultTemplate.MaxQuestions
                    : Math.Max(minQuestions, template.MaxQuestions);

                return new DashboardIntensityTemplateDto
                {
                    Code = defaultTemplate.Code,
                    Label = defaultTemplate.Label,
                    MinQuestions = minQuestions,
                    MaxQuestions = maxQuestions,
                    LockedRange = template.LockedRange,
                    Description = defaultTemplate.Description,
                };
            })
            .OrderBy(template => Array.FindIndex(DefaultIntensityTemplateSettings.Templates.ToArray(), item => item.Code == template.Code))
            .ToArray();

        var normalized = new DashboardIntensityTemplateSettingsDto
        {
            DefaultTemplateCode = string.IsNullOrWhiteSpace(request.DefaultTemplateCode) ? DefaultIntensityTemplateSettings.DefaultTemplateCode : request.DefaultTemplateCode,
            Templates = templates.Length > 0 ? templates : DefaultIntensityTemplateSettings.Templates,
        };

        await SaveSettingAsync(IntensityTemplatesKey, normalized, null, cancellationToken);
        return normalized;
    }

    public Task<DashboardReminderPreferencesDto> GetReminderPreferencesAsync(Guid userId, CancellationToken cancellationToken = default) =>
        GetSettingAsync(ReminderPreferencesKey, DefaultReminderPreferences, cancellationToken, userId);

    public async Task<DashboardReminderPreferencesDto> UpsertReminderPreferencesAsync(Guid userId, DashboardReminderPreferencesDto request, CancellationToken cancellationToken = default)
    {
        var normalized = new DashboardReminderPreferencesDto
        {
            Enabled = request.Enabled,
            RemindBeforeDays = Math.Clamp(request.RemindBeforeDays, 1, 30),
            DefaultDueInDays = Math.Clamp(request.DefaultDueInDays, 1, 60),
        };

        await SaveSettingAsync(ReminderPreferencesKey, normalized, userId, cancellationToken);
        return normalized;
    }

    public async Task<DashboardResumePointerDto?> GetResumePointerAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await GetSettingAsync<DashboardResumePointerDto?>(ResumePointerKey, null, cancellationToken, userId);
    }

    public async Task<DashboardResumePointerDto?> UpsertResumePointerAsync(Guid userId, UpsertDashboardResumePointerRequest request, CancellationToken cancellationToken = default)
    {
        var normalized = new DashboardResumePointerDto
        {
            AssessmentId = request.AssessmentId,
            SubModuleId = request.SubModuleId,
            QuestionId = request.QuestionId,
            TouchedAtUtc = request.TouchedAtUtc,
        };

        await SaveSettingAsync(ResumePointerKey, normalized, userId, cancellationToken);
        return normalized;
    }

    public async Task<bool> ClearResumePointerAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.DashboardSettings
            .SingleOrDefaultAsync(entity => entity.SettingKey == ResumePointerKey && entity.UserId == userId, cancellationToken);

        if (existing is null)
        {
            return false;
        }

        dbContext.DashboardSettings.Remove(existing);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<GovernanceAuditEntryDto>> GetAuditFeedAsync(int limit = 200, CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 200);
        var entries = await dbContext.GovernanceAuditEntries
            .AsNoTracking()
            .OrderByDescending(entity => entity.HappenedAtUtc)
            .Take(safeLimit)
            .ToListAsync(cancellationToken);

        return entries.Select(MapAuditEntry).ToArray();
    }

    public async Task<GovernanceAuditEntryDto> AppendAuditEntryAsync(CreateGovernanceAuditEntryRequest request, CancellationToken cancellationToken = default)
    {
        var entry = new GovernanceAuditEntry
        {
            GovernanceAuditEntryId = Guid.NewGuid(),
            Actor = request.Actor.Trim(),
            Action = request.Action.Trim(),
            EntityType = request.EntityType.Trim(),
            EntityName = request.EntityName.Trim(),
            Details = string.IsNullOrWhiteSpace(request.Details) ? null : request.Details.Trim(),
            HappenedAtUtc = request.HappenedAtUtc ?? DateTime.UtcNow,
        };

        dbContext.GovernanceAuditEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapAuditEntry(entry);
    }

    public async Task ClearAuditFeedAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.GovernanceAuditEntries.ExecuteDeleteAsync(cancellationToken);
    }

    private async Task<T> GetSettingAsync<T>(string key, T fallback, CancellationToken cancellationToken, Guid? userId = null)
    {
        var setting = await dbContext.DashboardSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(entity => entity.SettingKey == key && entity.UserId == userId, cancellationToken);

        if (setting is null)
        {
            return fallback;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(setting.ValueJson, JsonOptions) ?? fallback;
        }
        catch (JsonException)
        {
            return fallback;
        }
    }

    private async Task SaveSettingAsync<T>(string key, T value, Guid? userId, CancellationToken cancellationToken)
    {
        var serialized = JsonSerializer.Serialize(value, JsonOptions);
        var existing = await dbContext.DashboardSettings
            .SingleOrDefaultAsync(entity => entity.SettingKey == key && entity.UserId == userId, cancellationToken);

        if (existing is null)
        {
            dbContext.DashboardSettings.Add(new DashboardSetting
            {
                DashboardSettingId = Guid.NewGuid(),
                SettingKey = key,
                UserId = userId,
                ValueJson = serialized,
                UpdatedAtUtc = DateTime.UtcNow,
            });
        }
        else
        {
            existing.ValueJson = serialized;
            existing.UpdatedAtUtc = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static GovernanceAuditEntryDto MapAuditEntry(GovernanceAuditEntry entry) => new()
    {
        Id = entry.GovernanceAuditEntryId,
        Actor = entry.Actor,
        Action = entry.Action,
        EntityType = entry.EntityType,
        EntityName = entry.EntityName,
        Details = entry.Details,
        HappenedAtUtc = entry.HappenedAtUtc,
    };

    private static decimal Clamp(decimal value, decimal min, decimal max) => Math.Min(max, Math.Max(min, value));
}
