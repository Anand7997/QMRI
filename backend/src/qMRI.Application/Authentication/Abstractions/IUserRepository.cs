using qMRI.Domain.Common.Entities;

namespace qMRI.Application.Authentication.Abstractions;

public interface IUserRepository
{
    Task<User?> GetByUserNameOrEmailWithRolesAsync(string userNameOrEmail, CancellationToken cancellationToken = default);

    Task<bool> ExistsByUserNameOrEmailAsync(string userName, string email, CancellationToken cancellationToken = default);

    Task AddAsync(User user, CancellationToken cancellationToken = default);
}