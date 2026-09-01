namespace qMRI.Application.Authentication.DTOs;

public sealed class ClientAccessRequestDto
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
}
