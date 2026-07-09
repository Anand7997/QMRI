using qMRI.Domain.Assessments.Enums;

namespace qMRI.Application.Assessments.DTOs;

public sealed class ScoringModelDto
{
    public Guid ScoringModelId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public IReadOnlyList<ScoringRuleDto> Rules { get; set; } = Array.Empty<ScoringRuleDto>();
    public IReadOnlyList<MaturityBandDto> MaturityBands { get; set; } = Array.Empty<MaturityBandDto>();
}

public sealed class ScoringRuleDto
{
    public Guid ScoringRuleId { get; set; }
    public AnswerOption Answer { get; set; }
    public decimal Points { get; set; }
}

public sealed class MaturityBandDto
{
    public Guid MaturityBandId { get; set; }
    public decimal MinScore { get; set; }
    public decimal MaxScore { get; set; }
    public string Level { get; set; } = string.Empty;
    public string? Label { get; set; }
    public string? TmmiLevel { get; set; }
    public int SortOrder { get; set; }
}

public sealed class UpsertScoringModelRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; }
    public IReadOnlyList<UpsertScoringRuleRequest> Rules { get; set; } = Array.Empty<UpsertScoringRuleRequest>();
    public IReadOnlyList<UpsertMaturityBandRequest> MaturityBands { get; set; } = Array.Empty<UpsertMaturityBandRequest>();
}

public sealed class UpsertScoringRuleRequest
{
    public AnswerOption Answer { get; set; }
    public decimal Points { get; set; }
}

public sealed class UpsertMaturityBandRequest
{
    public decimal MinScore { get; set; }
    public decimal MaxScore { get; set; }
    public string Level { get; set; } = string.Empty;
    public string? Label { get; set; }
    public string? TmmiLevel { get; set; }
    public int SortOrder { get; set; }
}
