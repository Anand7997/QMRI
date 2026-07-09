namespace qMRI.Application.Authentication.DTOs;

public sealed class UserAccessRequestDto
{
    public Guid UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string RequestedRoleCode { get; set; } = string.Empty;

    public string ApprovalStatus { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public DateTime RequestedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? ApprovedAtUtc { get; set; }

    public Guid? ApprovedByUserId { get; set; }

    public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
}