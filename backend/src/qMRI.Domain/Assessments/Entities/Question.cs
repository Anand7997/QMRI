using qMRI.Domain.Assessments.Enums;

namespace qMRI.Domain.Assessments.Entities;

/// <summary>An assessment question answered with Yes / No / Partial.</summary>
public sealed class Question
{
    public Guid QuestionId { get; set; }

    public Guid SubModuleId { get; set; }

    public string Text { get; set; } = string.Empty;

    public string? Guidance { get; set; }

    public AnswerOption ExpectedAnswer { get; set; }

    public QuestionIntensity Intensity { get; set; } = QuestionIntensity.Tactical;

    public decimal Weight { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public SubModule? SubModule { get; set; }

    public ICollection<AssessmentResponse> Responses { get; set; } = new List<AssessmentResponse>();
}
