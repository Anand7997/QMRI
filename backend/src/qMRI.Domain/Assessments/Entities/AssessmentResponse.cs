using qMRI.Domain.Assessments.Enums;

namespace qMRI.Domain.Assessments.Entities;

/// <summary>A user's Yes/No/Partial answer to a question, with the resolved points.</summary>
public sealed class AssessmentResponse
{
    public Guid AssessmentResponseId { get; set; }

    public Guid AssessmentId { get; set; }

    public Guid QuestionId { get; set; }

    public AnswerOption Answer { get; set; }

    /// <summary>Points resolved from the scoring model at answer time (0-100).</summary>
    public decimal Points { get; set; }

    public string? Findings { get; set; }

    public DateTime AnsweredAtUtc { get; set; } = DateTime.UtcNow;

    public Assessment? Assessment { get; set; }

    public Question? Question { get; set; }
}
