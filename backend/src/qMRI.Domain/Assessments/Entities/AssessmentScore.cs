using qMRI.Domain.Assessments.Enums;

namespace qMRI.Domain.Assessments.Entities;

/// <summary>A computed score rollup at a given hierarchy scope (overall / category / module / submodule).</summary>
public sealed class AssessmentScore
{
    public Guid AssessmentScoreId { get; set; }

    public Guid AssessmentId { get; set; }

    public ScoreScope Scope { get; set; }

    public Guid? CategoryId { get; set; }

    public Guid? ModuleId { get; set; }

    public Guid? SubModuleId { get; set; }

    /// <summary>Weighted average score for the scope (0-100).</summary>
    public decimal Score { get; set; }

    public int AnsweredCount { get; set; }

    public int QuestionCount { get; set; }

    public string? MaturityLevel { get; set; }

    public DateTime CalculatedAtUtc { get; set; } = DateTime.UtcNow;

    public Assessment? Assessment { get; set; }

    public Category? Category { get; set; }

    public Module? Module { get; set; }

    public SubModule? SubModule { get; set; }
}
