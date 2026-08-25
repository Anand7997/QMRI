namespace qMRI.Application.Authentication.DTOs;

public sealed class ApproveUserWithIdentityLinkRequestDto
{
    public string? RoleCode { get; set; }

    public string? Category { get; set; }

    public DateTime ExpiresAtUtc { get; set; }

    public string? FrontendBaseUrl { get; set; }
}
