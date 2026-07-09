namespace qMRI.Domain.Assessments.Entities;

/// <summary>A checkpoint grouping within a module (Excel "Checkpoint").</summary>
public sealed class SubModule
{
    public Guid SubModuleId { get; set; }

    public Guid ModuleId { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal Weight { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public Module? Module { get; set; }

    public ICollection<Question> Questions { get; set; } = new List<Question>();
}
