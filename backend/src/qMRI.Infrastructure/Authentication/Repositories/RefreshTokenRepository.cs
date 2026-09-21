using qMRI.Application.Authentication.Abstractions;
using Microsoft.EntityFrameworkCore;
using qMRI.Domain.Common.Entities;
using qMRI.Infrastructure.Persistence;

namespace qMRI.Infrastructure.Authentication.Repositories;

public sealed class RefreshTokenRepository(qMRIDbContext dbContext) : IRefreshTokenRepository
{
    public Task<RefreshToken?> GetByIdAsync(Guid refreshTokenId, CancellationToken cancellationToken = default)
    {
        return dbContext.RefreshTokens
            .SingleOrDefaultAsync(token => token.RefreshTokenId == refreshTokenId, cancellationToken);
    }

    public async Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default)
    {
        await dbContext.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
