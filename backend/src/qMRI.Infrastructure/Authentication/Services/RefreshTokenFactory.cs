using System.Security.Cryptography;
using qMRI.Application.Authentication.Abstractions;

namespace qMRI.Infrastructure.Authentication.Services;

public sealed class RefreshTokenFactory : IRefreshTokenFactory
{
    public string CreateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        var token = Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        return token;
    }
}
