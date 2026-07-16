using Microsoft.EntityFrameworkCore;
using qMRI.Application.Authentication.Abstractions;
using qMRI.Domain.Common.Entities;
using qMRI.Infrastructure.Persistence;

namespace qMRI.Infrastructure.Authentication.Repositories;

public sealed class UserRepository(qMRIDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByUserNameOrEmailWithRolesAsync(string userNameOrEmail, CancellationToken cancellationToken = default)
    {
        var identifier = userNameOrEmail.Trim();

        return dbContext.Users
            .Include(user => user.UserRoles)
                .ThenInclude(userRole => userRole.Role)
            .AsNoTracking()
            .SingleOrDefaultAsync(
                user => user.UserName == identifier || user.Email == identifier,
                cancellationToken);
    }

    public Task<User?> GetByEmailWithRolesAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim();

        return dbContext.Users
            .Include(user => user.UserRoles)
                .ThenInclude(userRole => userRole.Role)
            .AsNoTracking()
            .SingleOrDefaultAsync(user => user.Email == normalizedEmail, cancellationToken);
    }

    public Task<User?> GetByIdentityLinkTokenHashWithRolesAsync(string tokenHash, CancellationToken cancellationToken = default)

    {

        var normalizedTokenHash = tokenHash.Trim();



        return dbContext.Users

            .Include(user => user.UserRoles)

                .ThenInclude(userRole => userRole.Role)

            .SingleOrDefaultAsync(user => user.IdentityLinkTokenHash == normalizedTokenHash, cancellationToken);

    }



    public Task SaveChangesAsync(CancellationToken cancellationToken = default)

    {

        return dbContext.SaveChangesAsync(cancellationToken);

    }


    public Task<bool> ExistsByUserNameOrEmailAsync(string userName, string email, CancellationToken cancellationToken = default)
    {
        var normalizedUserName = userName.Trim();
        var normalizedEmail = email.Trim();

        return dbContext.Users.AnyAsync(
            user => user.UserName == normalizedUserName || user.Email == normalizedEmail,
            cancellationToken);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await dbContext.Users.AddAsync(user, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
