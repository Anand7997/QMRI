using qMRI.Domain.Common.Entities;

namespace qMRI.Application.Authentication.Abstractions;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByIdAsync(Guid refreshTokenId, CancellationToken cancellationToken = default);

    Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default);
}
