namespace qMRI.Application.Assessments.DTOs;

public sealed class DashboardScoringPolicyDto
{
    public DashboardPillarWeightsDto PillarWeights { get; set; } = new();
    public decimal PassMark { get; set; }
    public DashboardRecommendationBandsDto RecommendationBands { get; set; } = new();
    public DateTime? UpdatedAtUtc { get; set; }
}

public sealed class DashboardPillarWeightsDto
{
    public decimal Technology { get; set; }
    public decimal OperatingModel { get; set; }
    public decimal Process { get; set; }
    public decimal People { get; set; }
}

public sealed class DashboardRecommendationBandsDto
{
    public decimal LowMax { get; set; }
    public decimal MediumMax { get; set; }
}

public sealed class DashboardIntensityTemplateSettingsDto
{
    public IReadOnlyList<DashboardIntensityTemplateDto> Templates { get; set; } = Array.Empty<DashboardIntensityTemplateDto>();
    public string DefaultTemplateCode { get; set; } = "Operational";
    public DateTime? UpdatedAtUtc { get; set; }
}

public sealed class DashboardIntensityTemplateDto
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public decimal MinQuestions { get; set; }
    public decimal MaxQuestions { get; set; }
    public bool LockedRange { get; set; }
    public string Description { get; set; } = string.Empty;
}

public sealed class DashboardReminderPreferencesDto
{
    public bool Enabled { get; set; }
    public int RemindBeforeDays { get; set; }
    public int DefaultDueInDays { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public sealed class DashboardResumePointerDto
{
    public Guid AssessmentId { get; set; }
    public Guid SubModuleId { get; set; }
    public Guid? QuestionId { get; set; }
    public DateTime TouchedAtUtc { get; set; }
}

public sealed class GovernanceAuditEntryDto
{
    public Guid Id { get; set; }
    public string Actor { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime HappenedAtUtc { get; set; }
}

public sealed class CreateGovernanceAuditEntryRequest
{
    public string Actor { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime? HappenedAtUtc { get; set; }
}

public sealed class UpsertDashboardResumePointerRequest
{
    public Guid AssessmentId { get; set; }
    public Guid SubModuleId { get; set; }
    public Guid? QuestionId { get; set; }
    public DateTime TouchedAtUtc { get; set; }
}
