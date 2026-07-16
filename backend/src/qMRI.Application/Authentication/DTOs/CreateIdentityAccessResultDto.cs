namespace qMRI.Application.Authentication.DTOs;

public sealed class CreateIdentityAccessResultDto
{
    public string AccessCode { get; set; } = string.Empty;

    public DateTime IdentityAccessExpiresAtUtc { get; set; }

    public UserAccessRequestDto User { get; set; } = new();
}
