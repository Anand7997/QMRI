using qMRI.Application.Authentication.Abstractions;
using qMRI.Domain.Common.Entities;
using qMRI.Infrastructure.Persistence;

namespace qMRI.Infrastructure.Authentication.Repositories;

public sealed class RefreshTokenRepository(qMRIDbContext dbContext) : IRefreshTokenRepository
{
    public async Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default)
    {
        await dbContext.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
