namespace qMRI.Domain.Common.Entities;

public sealed class UserRole
{
    public Guid UserId { get; set; }

    public Guid RoleId { get; set; }

    public DateTime AssignedAtUtc { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }

    public Role? Role { get; set; }
}
