using qMRI.Domain.Assessments.Enums;

namespace qMRI.Domain.Assessments.Entities;

/// <summary>A recommendation generated for an assessment, optionally scoped to a category or module.</summary>
public sealed class Recommendation
{
    public Guid RecommendationId { get; set; }

    public Guid AssessmentId { get; set; }

    public Guid? CategoryId { get; set; }

    public Guid? ModuleId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public RecommendationPriority Priority { get; set; } = RecommendationPriority.Medium;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Assessment? Assessment { get; set; }

    public Category? Category { get; set; }

    public Module? Module { get; set; }
}
