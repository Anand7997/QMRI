namespace qMRI.Domain.Assessments.Entities;

/// <summary>Configurable answer-to-points mapping plus maturity bands used to score an assessment.</summary>
public sealed class ScoringModel
{
    public Guid ScoringModelId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDefault { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<ScoringRule> Rules { get; set; } = new List<ScoringRule>();

    public ICollection<MaturityBand> MaturityBands { get; set; } = new List<MaturityBand>();
}
