namespace qMRI.Application.Authentication.DTOs;

public sealed class CreateIdentityAccessRequestDto
{
    public string Email { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }
}
