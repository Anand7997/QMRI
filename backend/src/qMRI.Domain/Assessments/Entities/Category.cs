namespace qMRI.Domain.Assessments.Entities;

/// <summary>Top level of the assessment hierarchy (e.g., Technology, Operating Model, Process, People).</summary>
public sealed class Category
{
    public Guid CategoryId { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<Module> Modules { get; set; } = new List<Module>();
}
