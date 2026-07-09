using qMRI.Domain.Common.Entities;

namespace qMRI.Application.Authentication.Abstractions;

public interface IRefreshTokenRepository
{
    Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default);
}
