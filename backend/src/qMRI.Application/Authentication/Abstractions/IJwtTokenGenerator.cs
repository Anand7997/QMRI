using qMRI.Domain.Common.Entities;

namespace qMRI.Application.Authentication.Abstractions;

public interface IJwtTokenGenerator
{
    (string AccessToken, DateTime ExpiresAtUtc) GenerateAccessToken(User user, IReadOnlyCollection<string> roles);
}
