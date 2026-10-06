namespace qMRI.Application.Authentication;

public static class PasswordPolicy
{
    public const int MinimumLength = 8;

    public static string? GetValidationError(string? password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            return "Password is required.";
        }

        if (password.Length < MinimumLength)
        {
            return $"Password must be at least {MinimumLength} characters.";
        }

        if (!password.Any(char.IsUpper))
        {
            return "Password must include at least one uppercase letter.";
        }

        if (!password.Any(char.IsLower))
        {
            return "Password must include at least one lowercase letter.";
        }

        if (!password.Any(char.IsDigit))
        {
            return "Password must include at least one number.";
        }

        if (!password.Any(character => !char.IsLetterOrDigit(character)))
        {
            return "Password must include at least one special character.";
        }

        return null;
    }
}
