namespace qMRI.Application.Authentication.DTOs;

public sealed class CreateIdentityLinkRequestDto
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? Category { get; set; }

    public DateTime ExpiresAtUtc { get; set; }

    public string? FrontendBaseUrl { get; set; }
}
