namespace qMRI.Application.Authentication.Abstractions;

public interface IBusinessEmailValidator
{
    bool IsValid(string? email);

    string? GetValidationError(string? email);
}
