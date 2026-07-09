using qMRI.Domain.Assessments.Enums;

namespace qMRI.Domain.Assessments.Entities;

/// <summary>Points awarded for a given answer within a scoring model (e.g., Yes = 100).</summary>
public sealed class ScoringRule
{
    public Guid ScoringRuleId { get; set; }

    public Guid ScoringModelId { get; set; }

    public AnswerOption Answer { get; set; }

    public decimal Points { get; set; }

    public ScoringModel? ScoringModel { get; set; }
}
