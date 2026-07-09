namespace qMRI.Domain.Assessments.Entities;

/// <summary>A Key Process Area within a category.</summary>
public sealed class Module
{
    public Guid ModuleId { get; set; }

    public Guid CategoryId { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal Weight { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Category? Category { get; set; }

    public ICollection<SubModule> SubModules { get; set; } = new List<SubModule>();
}
