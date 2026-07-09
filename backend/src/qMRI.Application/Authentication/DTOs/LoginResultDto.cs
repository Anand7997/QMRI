namespace qMRI.Application.Authentication.DTOs;

public enum AuthenticationFailureReason
{
    InvalidCredentials = 0,
    ApprovalPending = 1,
    AccessDisabled = 2
}

public sealed class LoginResultDto
{
    public LoginResponseDto? Response { get; private init; }

    public AuthenticationFailureReason? FailureReason { get; private init; }

    public string Message { get; private init; } = string.Empty;

    public bool Succeeded => Response is not null;

    public static LoginResultDto Success(LoginResponseDto response) => new()
    {
        Response = response
    };

    public static LoginResultDto Failure(AuthenticationFailureReason reason, string message) => new()
    {
        FailureReason = reason,
        Message = message
    };
}