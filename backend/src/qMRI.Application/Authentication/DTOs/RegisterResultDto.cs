namespace qMRI.Application.Authentication.DTOs;

public enum RegistrationFailureReason
{
    Validation = 0,
    DuplicateAccount = 1
}

public sealed class RegisterResultDto
{
    public RegisterResponseDto? Response { get; private init; }

    public RegistrationFailureReason? FailureReason { get; private init; }

    public string Message { get; private init; } = string.Empty;

    public bool Succeeded => Response is not null;

    public static RegisterResultDto Success(RegisterResponseDto response) => new()
    {
        Response = response
    };

    public static RegisterResultDto Failure(RegistrationFailureReason reason, string message) => new()
    {
        FailureReason = reason,
        Message = message
    };
}