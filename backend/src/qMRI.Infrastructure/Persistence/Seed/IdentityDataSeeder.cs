using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using qMRI.Application.Authentication.Abstractions;
using qMRI.Domain.Common.Entities;
using qMRI.Domain.Common.Enums;

namespace qMRI.Infrastructure.Persistence.Seed;

/// <summary>
/// Idempotent startup seeding of security roles and the bootstrap administrator account.
/// Passwords are hashed at runtime (PBKDF2), so nothing sensitive is stored in source or migrations.
/// </summary>
public static class IdentityDataSeeder
{
    public const string AdminRoleCode = "ADMIN";
    public const string UserRoleCode = "USER";

    private const string AdminUserName = "vanand";
    private const string AdminEmail = "vanand@quinnox.com";
    private const string AdminPassword = "Rocky@237";

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        var dbContext = services.GetRequiredService<qMRIDbContext>();
        var passwordHashingService = services.GetRequiredService<IPasswordHashingService>();

        // Ensure the schema is present before seeding.
        await dbContext.Database.MigrateAsync(cancellationToken);

        var adminRole = await EnsureRoleAsync(dbContext, AdminRoleCode, "Administrator", cancellationToken);
        await EnsureRoleAsync(dbContext, UserRoleCode, "User", cancellationToken);

        var admin = await dbContext.Users
            .SingleOrDefaultAsync(user => user.Email == AdminEmail || user.UserName == AdminUserName, cancellationToken);

        if (admin is null)
        {
            var nowUtc = DateTime.UtcNow;
            admin = new User
            {
                UserId = Guid.NewGuid(),
                FullName = "V Anand",
                UserName = AdminUserName,
                Email = AdminEmail,
                PasswordHash = passwordHashingService.HashPassword(AdminPassword),
                IsActive = true,
                ApprovalStatus = UserApprovalStatus.Approved,
                RequestedRoleCode = AdminRoleCode,
                Category = "QE",
                RequestedAtUtc = nowUtc,
                ApprovedAtUtc = nowUtc,
                CreatedAtUtc = nowUtc
            };

            dbContext.Users.Add(admin);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        else
        {
            var changed = false;

            if (string.IsNullOrWhiteSpace(admin.FullName))
            {
                admin.FullName = "V Anand";
                changed = true;
            }

            if (admin.ApprovalStatus != UserApprovalStatus.Approved || !admin.IsActive)
            {
                admin.ApprovalStatus = UserApprovalStatus.Approved;
                admin.IsActive = true;
                admin.ApprovedAtUtc ??= DateTime.UtcNow;
                changed = true;
            }

            if (!string.Equals(admin.RequestedRoleCode, AdminRoleCode, StringComparison.OrdinalIgnoreCase))
            {
                admin.RequestedRoleCode = AdminRoleCode;
                changed = true;
            }

            if (string.IsNullOrWhiteSpace(admin.Category))
            {
                admin.Category = "QE";
                changed = true;
            }

            if (changed)
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        var hasAdminRole = await dbContext.UserRoles
            .AnyAsync(userRole => userRole.UserId == admin.UserId && userRole.RoleId == adminRole.RoleId, cancellationToken);

        if (!hasAdminRole)
        {
            dbContext.UserRoles.Add(new UserRole
            {
                UserId = admin.UserId,
                RoleId = adminRole.RoleId,
                AssignedAtUtc = DateTime.UtcNow
            });

            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private static async Task<Role> EnsureRoleAsync(
        qMRIDbContext dbContext,
        string code,
        string name,
        CancellationToken cancellationToken)
    {
        var role = await dbContext.Roles.SingleOrDefaultAsync(r => r.Code == code, cancellationToken);
        if (role is not null)
        {
            return role;
        }

        role = new Role
        {
            RoleId = Guid.NewGuid(),
            Code = code,
            Name = name,
            IsActive = true
        };

        dbContext.Roles.Add(role);
        await dbContext.SaveChangesAsync(cancellationToken);

        return role;
    }
}
