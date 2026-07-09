namespace qMRI.Application.Authentication.DTOs;

public sealed class AuthenticatedUserDto
{
    public Guid UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string ApprovalStatus { get; set; } = string.Empty;

    public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
}