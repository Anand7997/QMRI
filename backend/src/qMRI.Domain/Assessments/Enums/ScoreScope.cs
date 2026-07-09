namespace qMRI.Domain.Assessments.Enums;

/// <summary>The hierarchy level a computed <c>AssessmentScore</c> rolls up to.</summary>
public enum ScoreScope
{
    Overall = 0,
    Category = 1,
    Module = 2,
    SubModule = 3
}
