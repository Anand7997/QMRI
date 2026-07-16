namespace qMRI.Application.Authentication.DTOs;

public sealed class IdentityAccessLoginRequestDto
{
    public string Email { get; set; } = string.Empty;

    public string AccessCode { get; set; } = string.Empty;
}
