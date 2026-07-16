namespace qMRI.Application.Authentication.DTOs;

public sealed class CreateIdentityLinkResultDto
{
    public string Link { get; set; } = string.Empty;

    public DateTime IdentityLinkExpiresAtUtc { get; set; }

    public UserAccessRequestDto User { get; set; } = new();
}
