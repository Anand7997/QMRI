using Microsoft.EntityFrameworkCore;
using qMRI.Application.Authentication.Abstractions;
using qMRI.Application.Authentication.DTOs;
using qMRI.Domain.Common.Entities;
using qMRI.Domain.Common.Enums;
using qMRI.Infrastructure.Persistence;

namespace qMRI.Infrastructure.Authentication.Services;

public sealed class UserAdministrationService(qMRIDbContext dbContext) : IUserAdministrationService
{
    private const string AdminRoleCode = "ADMIN";
    private const string UserRoleCode = "USER";

    public async Task<IReadOnlyCollection<UserAccessRequestDto>> GetUsersAsync(
        UserApprovalStatus? approvalStatus = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Users
            .Include(user => user.UserRoles)
                .ThenInclude(userRole => userRole.Role)
            .AsNoTracking();

        if (approvalStatus.HasValue)
        {
            query = query.Where(user => user.ApprovalStatus == approvalStatus.Value);
        }

        var users = await query
            .OrderBy(user => user.ApprovalStatus == UserApprovalStatus.Pending ? 0 : 1)
            .ThenByDescending(user => user.RequestedAtUtc)
            .ThenBy(user => user.FullName)
            .ToListAsync(cancellationToken);

        return users.Select(MapUser).ToArray();
    }

    public async Task<UserAccessRequestDto?> ApproveUserAsync(
        Guid userId,
        Guid approvedByUserId,
        string? roleCode = null,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .Include(entity => entity.UserRoles)
                .ThenInclude(userRole => userRole.Role)
            .SingleOrDefaultAsync(entity => entity.UserId == userId, cancellationToken);

        if (user is null)
        {
            return null;
        }

        var requestedRoleCode = NormalizeRequestedRole(roleCode ?? user.RequestedRoleCode);
        var role = await dbContext.Roles
            .SingleOrDefaultAsync(entity => entity.Code == requestedRoleCode && entity.IsActive, cancellationToken);

        if (role is null)
        {
            throw new InvalidOperationException($"Role '{requestedRoleCode}' is not configured.");
        }

        user.RequestedRoleCode = requestedRoleCode;
        user.ApprovalStatus = UserApprovalStatus.Approved;
        user.IsActive = true;
        user.ApprovedAtUtc = DateTime.UtcNow;
        user.ApprovedByUserId = approvedByUserId;

        var hasRole = user.UserRoles.Any(userRole => userRole.RoleId == role.RoleId);
        if (!hasRole)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = user.UserId,
                RoleId = role.RoleId,
                Role = role,
                AssignedAtUtc = DateTime.UtcNow
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return MapUser(user);
    }

    private static UserAccessRequestDto MapUser(User user)
    {
        return new UserAccessRequestDto
        {
            UserId = user.UserId,
            FullName = user.FullName,
            UserName = user.UserName,
            Email = user.Email,
            RequestedRoleCode = user.RequestedRoleCode,
            ApprovalStatus = user.ApprovalStatus.ToString(),
            IsActive = user.IsActive,
            RequestedAtUtc = user.RequestedAtUtc,
            CreatedAtUtc = user.CreatedAtUtc,
            ApprovedAtUtc = user.ApprovedAtUtc,
            ApprovedByUserId = user.ApprovedByUserId,
            Roles = user.UserRoles
                .Where(userRole => userRole.Role is not null && userRole.Role.IsActive)
                .Select(userRole => userRole.Role!.Code.ToUpperInvariant())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray()
        };
    }

    private static string NormalizeRequestedRole(string? requestedRole)
    {
        return string.Equals(requestedRole, AdminRoleCode, StringComparison.OrdinalIgnoreCase)
            ? AdminRoleCode
            : UserRoleCode;
    }
}
