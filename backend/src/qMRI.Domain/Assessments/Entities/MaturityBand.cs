namespace qMRI.Domain.Assessments.Entities;

/// <summary>Maps a score range (0-100) to a maturity level (e.g., 91-100 = IQ / Learning).</summary>
public sealed class MaturityBand
{
    public Guid MaturityBandId { get; set; }

    public Guid ScoringModelId { get; set; }

    public decimal MinScore { get; set; }

    public decimal MaxScore { get; set; }

    /// <summary>TOPP level, e.g., Testing / QA / QE / IQ.</summary>
    public string Level { get; set; } = string.Empty;

    /// <summary>Human label, e.g., Initiating / Diagnosing / Establishing / Acting / Learning.</summary>
    public string? Label { get; set; }

    /// <summary>Optional TMMi level, e.g., Initial / Managed / Defined / Measured / Optimization.</summary>
    public string? TmmiLevel { get; set; }

    public int SortOrder { get; set; }

    public ScoringModel? ScoringModel { get; set; }
}
