namespace qMRI.Application.Authentication.DTOs;

public sealed class LoginResponseDto
{
    public string AccessToken { get; set; } = string.Empty;

    public DateTime AccessTokenExpiresAtUtc { get; set; }

    public RefreshTokenDto RefreshToken { get; set; } = new();

    public AuthenticatedUserDto User { get; set; } = new();
}
