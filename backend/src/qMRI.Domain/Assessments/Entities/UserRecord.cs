namespace qMRI.Domain.Assessments.Entities;

public sealed class UserRecord
{
    public Guid UserRecordId { get; set; }

    public Guid AssessmentId { get; set; }

    public Guid UserId { get; set; }

    public string UserName { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAtUtc { get; set; }

    public DateTime? EndedAtUtc { get; set; }

    public DateTime RecordDateUtc { get; set; } = DateTime.UtcNow.Date;
}
