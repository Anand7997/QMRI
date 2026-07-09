namespace qMRI.Application.Authentication.DTOs;

public sealed class RefreshTokenDto
{
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }
}
