namespace qMRI.Domain.Assessments.Entities;

public sealed class AdminRecord
{
    public Guid AdminRecordId { get; set; }

    public Guid AssessmentId { get; set; }

    public Guid AssignedByUserId { get; set; }

    public string AssignedByUserName { get; set; } = string.Empty;

    public string AssignedByFullName { get; set; } = string.Empty;

    public Guid AssignedToUserId { get; set; }

    public string AssignedToUserName { get; set; } = string.Empty;

    public string AssignedToFullName { get; set; } = string.Empty;

    public string? AssignedDepartments { get; set; }

    public string? AssignedQuestionIds { get; set; }

    public DateTime AssignedAtUtc { get; set; } = DateTime.UtcNow;
}
