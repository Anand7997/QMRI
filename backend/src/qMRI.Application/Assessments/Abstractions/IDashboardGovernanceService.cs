using qMRI.Application.Assessments.DTOs;

namespace qMRI.Application.Assessments.Abstractions;

public interface IDashboardGovernanceService
{
    Task<DashboardScoringPolicyDto> GetScoringPolicyAsync(CancellationToken cancellationToken = default);
    Task<DashboardScoringPolicyDto> UpsertScoringPolicyAsync(DashboardScoringPolicyDto request, CancellationToken cancellationToken = default);

    Task<DashboardIntensityTemplateSettingsDto> GetIntensityTemplateSettingsAsync(CancellationToken cancellationToken = default);
    Task<DashboardIntensityTemplateSettingsDto> UpsertIntensityTemplateSettingsAsync(DashboardIntensityTemplateSettingsDto request, CancellationToken cancellationToken = default);

    Task<DashboardReminderPreferencesDto> GetReminderPreferencesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<DashboardReminderPreferencesDto> UpsertReminderPreferencesAsync(Guid userId, DashboardReminderPreferencesDto request, CancellationToken cancellationToken = default);

    Task<DashboardResumePointerDto?> GetResumePointerAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<DashboardResumePointerDto?> UpsertResumePointerAsync(Guid userId, UpsertDashboardResumePointerRequest request, CancellationToken cancellationToken = default);
    Task<bool> ClearResumePointerAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<GovernanceAuditEntryDto>> GetAuditFeedAsync(int limit = 200, CancellationToken cancellationToken = default);
    Task<GovernanceAuditEntryDto> AppendAuditEntryAsync(CreateGovernanceAuditEntryRequest request, CancellationToken cancellationToken = default);
    Task ClearAuditFeedAsync(CancellationToken cancellationToken = default);
}
