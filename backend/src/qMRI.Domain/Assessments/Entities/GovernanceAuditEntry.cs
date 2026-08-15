namespace qMRI.Domain.Assessments.Entities;

public sealed class GovernanceAuditEntry
{
    public Guid GovernanceAuditEntryId { get; set; }

    public string Actor { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    public string EntityType { get; set; } = string.Empty;

    public string EntityName { get; set; } = string.Empty;

    public string? Details { get; set; }

    public DateTime HappenedAtUtc { get; set; } = DateTime.UtcNow;
}
