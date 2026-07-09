using qMRI.Domain.Assessments.Enums;

namespace qMRI.Application.Assessments.DTOs;

public sealed class CreateAssessmentRequest
{
    public Guid? UserId { get; set; }
    public Guid? ScoringModelId { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
}

public sealed class UpdateAssessmentRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
}
public sealed class AssessmentSummaryDto
{
    public Guid AssessmentId { get; set; }
    public Guid UserId { get; set; }
    public Guid? ScoringModelId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public AssessmentStatus Status { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? SubmittedAtUtc { get; set; }
    public DateTime? ScoredAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public int AnsweredCount { get; set; }
    public int QuestionCount { get; set; }
    public decimal CompletionPercentage { get; set; }
    public decimal? OverallScore { get; set; }
    public string? OverallMaturityLevel { get; set; }
}

public sealed class AssessmentDetailDto
{
    public AssessmentSummaryDto Summary { get; set; } = new();
    public IReadOnlyList<AssessmentResponseDto> Responses { get; set; } = Array.Empty<AssessmentResponseDto>();
    public IReadOnlyList<AssessmentScoreDto> Scores { get; set; } = Array.Empty<AssessmentScoreDto>();
    public IReadOnlyList<RecommendationDto> Recommendations { get; set; } = Array.Empty<RecommendationDto>();
}

public sealed class AssessmentResponseDto
{
    public Guid AssessmentResponseId { get; set; }
    public Guid AssessmentId { get; set; }
    public Guid QuestionId { get; set; }
    public AnswerOption Answer { get; set; }
    public decimal Points { get; set; }
    public string? Findings { get; set; }
    public DateTime AnsweredAtUtc { get; set; }
}

public sealed class UpsertAssessmentResponseRequest
{
    public Guid QuestionId { get; set; }
    public AnswerOption Answer { get; set; }
    public string? Findings { get; set; }
}

public sealed class AssessmentScoreDto
{
    public Guid AssessmentScoreId { get; set; }
    public Guid AssessmentId { get; set; }
    public ScoreScope Scope { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public Guid? ModuleId { get; set; }
    public string? ModuleName { get; set; }
    public Guid? SubModuleId { get; set; }
    public string? SubModuleName { get; set; }
    public decimal Score { get; set; }
    public int AnsweredCount { get; set; }
    public int QuestionCount { get; set; }
    public string? MaturityLevel { get; set; }
    public DateTime CalculatedAtUtc { get; set; }
}

public sealed class RecommendationDto
{
    public Guid RecommendationId { get; set; }
    public Guid AssessmentId { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public Guid? ModuleId { get; set; }
    public string? ModuleName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RecommendationPriority Priority { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
