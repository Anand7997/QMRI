using qMRI.Domain.Common.Enums;

namespace qMRI.Domain.Common.Entities;

public sealed class User
{
    public Guid UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public UserApprovalStatus ApprovalStatus { get; set; } = UserApprovalStatus.Approved;

    public string RequestedRoleCode { get; set; } = "USER";

    public string Category { get; set; } = "Fresher";

    public DateTime RequestedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? ApprovedAtUtc { get; set; }

    public Guid? ApprovedByUserId { get; set; }

    public DateTime? IdentityAccessExpiresAtUtc { get; set; }



    public string? IdentityLinkTokenHash { get; set; }



    public DateTime? IdentityLinkExpiresAtUtc { get; set; }



    public DateTime? IdentityLinkConsumedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
