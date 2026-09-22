using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using qMRI.Application.Authentication.Abstractions;
using qMRI.Infrastructure.Authentication.Options;

namespace qMRI.Infrastructure.Authentication.Services;

public sealed class BusinessEmailValidator(IOptions<BusinessEmailOptions> options) : IBusinessEmailValidator
{
    private static readonly Regex LocalPartRegex = new(
        @"^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex DomainRegex = new(
        @"^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly HashSet<string> _blockedDomains = (options.Value.BlockedDomains ?? [])
        .Select(domain => domain.Trim().TrimStart('.').ToLowerInvariant())
        .Where(domain => !string.IsNullOrWhiteSpace(domain))
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    public bool IsValid(string? email) => GetValidationError(email) is null;

    public string? GetValidationError(string? email)
    {
        if (string.IsNullOrEmpty(email))
        {
            return "Work email is required.";
        }

        if (email.Length > 256 || email.Any(char.IsWhiteSpace))
        {
            return "Enter a valid business email address without spaces.";
        }

        var atIndex = email.IndexOf('@');
        if (atIndex <= 0 || atIndex != email.LastIndexOf('@') || atIndex == email.Length - 1)
        {
            return "Enter a valid business email address.";
        }

        var localPart = email[..atIndex];
        var domain = email[(atIndex + 1)..].ToLowerInvariant();
        var topLevelDomain = domain[(domain.LastIndexOf('.') + 1)..];

        if (localPart.Length > 64
            || localPart.StartsWith('.')
            || localPart.EndsWith('.')
            || localPart.Contains("..", StringComparison.Ordinal)
            || !LocalPartRegex.IsMatch(localPart)
            || domain.Length > 253
            || !DomainRegex.IsMatch(domain)
            || topLevelDomain.Length < 2)
        {
            return "Enter a valid business email address.";
        }

        if (_blockedDomains.Any(blocked =>
                string.Equals(domain, blocked, StringComparison.OrdinalIgnoreCase)
                || domain.EndsWith($".{blocked}", StringComparison.OrdinalIgnoreCase)))
        {
            return "Please use a company or organizational email address.";
        }

        return null;
    }
}
