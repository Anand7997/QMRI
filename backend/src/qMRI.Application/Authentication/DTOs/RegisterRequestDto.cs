namespace qMRI.Application.Authentication.DTOs;

public sealed class RegisterRequestDto
{
    public string FullName { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string RequestedRole { get; set; } = "USER";
}