using qMRI.Domain.Assessments.Enums;

namespace qMRI.Domain.Assessments.Entities;

/// <summary>A user's assessment instance (attempt) over the question set.</summary>
public sealed class Assessment
{
    public Guid AssessmentId { get; set; }

    public Guid UserId { get; set; }

    public Guid? ScoringModelId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public AssessmentStatus Status { get; set; } = AssessmentStatus.Draft;

    public DateTime? StartedAtUtc { get; set; }

    public DateTime? SubmittedAtUtc { get; set; }

    public DateTime? ScoredAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ScoringModel? ScoringModel { get; set; }

    public ICollection<AssessmentResponse> Responses { get; set; } = new List<AssessmentResponse>();

    public ICollection<AssessmentScore> Scores { get; set; } = new List<AssessmentScore>();

    public ICollection<Recommendation> Recommendations { get; set; } = new List<Recommendation>();
}
