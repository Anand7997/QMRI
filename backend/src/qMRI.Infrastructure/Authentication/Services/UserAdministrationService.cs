using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using qMRI.Application.Authentication.Abstractions;
using qMRI.Application.Authentication.DTOs;
using qMRI.Domain.Common.Entities;
using qMRI.Domain.Common.Enums;
using qMRI.Infrastructure.Persistence;

namespace qMRI.Infrastructure.Authentication.Services;

public sealed class UserAdministrationService(
    qMRIDbContext dbContext,
    IPasswordHashingService passwordHashingService) : IUserAdministrationService
{
    private const string AdminRoleCode = "ADMIN";
    private const string UserRoleCode = "USER";
    private const string GuestRoleCode = "GUEST";
    private const string DefaultCategory = "Fresher";
    private const string GuestCategory = "Guest";
    private const string AccessCodeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private static readonly string[] AllowedCategories =
    [
        "Fresher",
        "Digital",
        "Ai",
        "QE",
        "Delevery",
        GuestCategory
    ];

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
            .ThenBy(user => user.RequestedRoleCode == GuestRoleCode ? 0 : 1)
            .ThenByDescending(user => user.RequestedAtUtc)
            .ThenBy(user => user.FullName)
            .ToListAsync(cancellationToken);

        return users.Select(MapUser).ToArray();
    }

    public async Task<UserAccessRequestDto?> ApproveUserAsync(
        Guid userId,
        Guid approvedByUserId,
        string? roleCode = null,
        string? category = null,
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
        var normalizedCategory = NormalizeCategoryForRole(requestedRoleCode, category ?? user.Category);
        var role = await dbContext.Roles
            .SingleOrDefaultAsync(entity => entity.Code == requestedRoleCode && entity.IsActive, cancellationToken);

        if (role is null)
        {
            throw new InvalidOperationException($"Role '{requestedRoleCode}' is not configured.");
        }

        user.RequestedRoleCode = requestedRoleCode;
        user.Category = normalizedCategory;
        user.ApprovalStatus = UserApprovalStatus.Approved;
        user.IsActive = true;
        user.ApprovedAtUtc = DateTime.UtcNow;
        user.ApprovedByUserId = approvedByUserId;
        if (!string.Equals(requestedRoleCode, GuestRoleCode, StringComparison.OrdinalIgnoreCase))
        {
            user.IdentityAccessExpiresAtUtc = null;
        }

        await ReplaceManagedRoleAsync(user, role, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapUser(user);
    }

    public async Task<CreateIdentityAccessResultDto> CreateIdentityAccessAsync(
        Guid createdByUserId,
        CreateIdentityAccessRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim();
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.", nameof(request.Email));
        }

        if (!email.Contains("@", StringComparison.Ordinal) || !email.Contains(".", StringComparison.Ordinal))
        {
            throw new ArgumentException("Enter a valid guest email address.", nameof(request.Email));
        }

        var expiresAtUtc = ToUtc(request.ExpiresAtUtc);
        if (expiresAtUtc <= DateTime.UtcNow)
        {
            throw new ArgumentException("Identity access expiry must be in the future.", nameof(request.ExpiresAtUtc));
        }

        var existingEmail = await dbContext.Users
            .AnyAsync(user => user.Email == email, cancellationToken);
        if (existingEmail)
        {
            throw new InvalidOperationException("An account with this email already exists.");
        }

        var guestRole = await dbContext.Roles
            .SingleOrDefaultAsync(role => role.Code == GuestRoleCode && role.IsActive, cancellationToken);
        if (guestRole is null)
        {
            throw new InvalidOperationException("Role 'GUEST' is not configured.");
        }

        var nowUtc = DateTime.UtcNow;
        var accessCode = CreateAccessCode();
        var user = new User
        {
            UserId = Guid.NewGuid(),
            FullName = BuildGuestFullName(email),
            UserName = await GenerateGuestUserNameAsync(email, cancellationToken),
            Email = email,
            PasswordHash = passwordHashingService.HashPassword(accessCode),
            IsActive = true,
            ApprovalStatus = UserApprovalStatus.Approved,
            RequestedRoleCode = GuestRoleCode,
            Category = GuestCategory,
            RequestedAtUtc = nowUtc,
            ApprovedAtUtc = nowUtc,
            ApprovedByUserId = createdByUserId,
            IdentityAccessExpiresAtUtc = expiresAtUtc,
            CreatedAtUtc = nowUtc
        };

        user.UserRoles.Add(new UserRole
        {
            UserId = user.UserId,
            RoleId = guestRole.RoleId,
            Role = guestRole,
            AssignedAtUtc = nowUtc
        });

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new CreateIdentityAccessResultDto
        {
            AccessCode = accessCode,
            IdentityAccessExpiresAtUtc = expiresAtUtc,
            User = MapUser(user)
        };
    }

    public async Task<CreateIdentityLinkResultDto> CreateIdentityLinkAsync(
        Guid createdByUserId,
        CreateIdentityLinkRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var fullName = request.FullName.Trim();
        var email = request.Email.Trim();
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException("Client name is required.", nameof(request.FullName));
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.", nameof(request.Email));
        }

        if (!email.Contains("@", StringComparison.Ordinal) || !email.Contains(".", StringComparison.Ordinal))
        {
            throw new ArgumentException("Enter a valid client email address.", nameof(request.Email));
        }

        var expiresAtUtc = ToUtc(request.ExpiresAtUtc);
        if (expiresAtUtc <= DateTime.UtcNow)
        {
            throw new ArgumentException("Identity link expiry must be in the future.", nameof(request.ExpiresAtUtc));
        }

        var existingEmail = await dbContext.Users
            .AnyAsync(user => user.Email == email, cancellationToken);
        if (existingEmail)
        {
            throw new InvalidOperationException("An account with this email already exists.");
        }

        var userRole = await dbContext.Roles
            .SingleOrDefaultAsync(role => role.Code == UserRoleCode && role.IsActive, cancellationToken);
        if (userRole is null)
        {
            throw new InvalidOperationException("Role 'USER' is not configured.");
        }

        var nowUtc = DateTime.UtcNow;
        var linkToken = CreateIdentityLinkToken();
        var user = new User
        {
            UserId = Guid.NewGuid(),
            FullName = fullName,
            UserName = await GenerateClientUserNameAsync(email, cancellationToken),
            Email = email,
            PasswordHash = passwordHashingService.HashPassword(CreateAccessCode(24)),
            IsActive = true,
            ApprovalStatus = UserApprovalStatus.Approved,
            RequestedRoleCode = UserRoleCode,
            Category = NormalizeCategory(request.Category),
            RequestedAtUtc = nowUtc,
            ApprovedAtUtc = nowUtc,
            ApprovedByUserId = createdByUserId,
            IdentityLinkTokenHash = AuthenticationService.HashIdentityLinkToken(linkToken),
            IdentityLinkExpiresAtUtc = expiresAtUtc,
            CreatedAtUtc = nowUtc
        };

        user.UserRoles.Add(new UserRole
        {
            UserId = user.UserId,
            RoleId = userRole.RoleId,
            Role = userRole,
            AssignedAtUtc = nowUtc
        });

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new CreateIdentityLinkResultDto
        {
            Link = BuildIdentityLink(request.FrontendBaseUrl, linkToken),
            IdentityLinkExpiresAtUtc = expiresAtUtc,
            User = MapUser(user)
        };
    }
    public async Task<UserAccessRequestDto?> UpdateUserAccessAsync(
        Guid userId,
        Guid modifiedByUserId,
        string? roleCode,
        string? category,
        bool isActive,
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

        var normalizedRoleCode = NormalizeRequestedRole(roleCode ?? user.RequestedRoleCode);
        var role = await dbContext.Roles
            .SingleOrDefaultAsync(entity => entity.Code == normalizedRoleCode && entity.IsActive, cancellationToken);
        if (role is null)
        {
            throw new InvalidOperationException($"Role '{normalizedRoleCode}' is not configured.");
        }

        user.RequestedRoleCode = normalizedRoleCode;
        user.Category = NormalizeCategoryForRole(normalizedRoleCode, category ?? user.Category);
        user.IsActive = isActive;
        user.ApprovedByUserId = modifiedByUserId;
        if (!string.Equals(normalizedRoleCode, GuestRoleCode, StringComparison.OrdinalIgnoreCase))
        {
            user.IdentityAccessExpiresAtUtc = null;
        }

        await ReplaceManagedRoleAsync(user, role, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapUser(user);
    }

    public async Task<bool> DeactivateUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(entity => entity.UserId == userId, cancellationToken);
        if (user is null)
        {
            return false;
        }

        var ownedAssessmentIds = await dbContext.Assessments
            .Where(entity => entity.UserId == userId)
            .Select(entity => entity.AssessmentId)
            .ToArrayAsync(cancellationToken);

        if (ownedAssessmentIds.Length > 0)
        {
            var ownedAssessments = await dbContext.Assessments
                .Where(entity => ownedAssessmentIds.Contains(entity.AssessmentId))
                .ToListAsync(cancellationToken);
            dbContext.Assessments.RemoveRange(ownedAssessments);
        }

        var adminRecords = await dbContext.AdminRecords
            .Where(entity =>
                (entity.AssignedByUserId == userId || entity.AssignedToUserId == userId)
                && !ownedAssessmentIds.Contains(entity.AssessmentId))
            .ToListAsync(cancellationToken);
        if (adminRecords.Count > 0)
        {
            dbContext.AdminRecords.RemoveRange(adminRecords);
        }

        var userRecords = await dbContext.UserRecords
            .Where(entity => entity.UserId == userId && !ownedAssessmentIds.Contains(entity.AssessmentId))
            .ToListAsync(cancellationToken);
        if (userRecords.Count > 0)
        {
            dbContext.UserRecords.RemoveRange(userRecords);
        }

        dbContext.Users.Remove(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task ReplaceManagedRoleAsync(User user, Role role, CancellationToken cancellationToken)
    {
        var managedRoleIds = await dbContext.Roles
            .Where(entity => entity.Code == AdminRoleCode || entity.Code == UserRoleCode || entity.Code == GuestRoleCode)
            .Select(entity => entity.RoleId)
            .ToArrayAsync(cancellationToken);

        var obsoleteRoles = user.UserRoles
            .Where(userRole => managedRoleIds.Contains(userRole.RoleId) && userRole.RoleId != role.RoleId)
            .ToArray();
        dbContext.UserRoles.RemoveRange(obsoleteRoles);

        if (user.UserRoles.All(userRole => userRole.RoleId != role.RoleId))
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = user.UserId,
                RoleId = role.RoleId,
                Role = role,
                AssignedAtUtc = DateTime.UtcNow
            });
        }
    }

    private async Task<string> GenerateClientUserNameAsync(string email, CancellationToken cancellationToken)
    {
        var baseAlias = BuildEmailAlias(email, "client");

        for (var attempt = 0; attempt < 20; attempt++)
        {
            var candidate = $"{baseAlias}.client.{CreateNumericCode(attempt == 0 ? 4 : 6)}";
            var exists = await dbContext.Users.AnyAsync(user => user.UserName == candidate, cancellationToken);
            if (!exists)
            {
                return candidate;
            }
        }

        throw new InvalidOperationException("Unable to generate a unique client username.");
    }
    private async Task<string> GenerateGuestUserNameAsync(string email, CancellationToken cancellationToken)
    {
        var baseAlias = BuildGuestAlias(email);

        for (var attempt = 0; attempt < 20; attempt++)
        {
            var candidate = $"{baseAlias}.guest.{CreateNumericCode(attempt == 0 ? 4 : 6)}";
            var exists = await dbContext.Users.AnyAsync(user => user.UserName == candidate, cancellationToken);
            if (!exists)
            {
                return candidate;
            }
        }

        throw new InvalidOperationException("Unable to generate a unique guest username.");
    }

    private static string CreateIdentityLinkToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-", StringComparison.Ordinal)
            .Replace("/", "_", StringComparison.Ordinal)
            .TrimEnd('=');
    }

    private static string BuildIdentityLink(string? frontendBaseUrl, string token)
    {
        var baseUrl = string.IsNullOrWhiteSpace(frontendBaseUrl)
            ? "http://localhost:8081"
            : frontendBaseUrl.Trim();

        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var parsedBaseUrl)
            || (parsedBaseUrl.Scheme != Uri.UriSchemeHttp && parsedBaseUrl.Scheme != Uri.UriSchemeHttps))
        {
            baseUrl = "http://localhost:8081";
        }

        return $"{baseUrl.TrimEnd('/')}/identity-link?token={Uri.EscapeDataString(token)}";
    }
    private static string CreateAccessCode(int length = 10)
    {
        var builder = new StringBuilder(length);
        for (var index = 0; index < length; index++)
        {
            var charIndex = RandomNumberGenerator.GetInt32(AccessCodeCharacters.Length);
            builder.Append(AccessCodeCharacters[charIndex]);
        }

        return builder.ToString();
    }

    private static string CreateNumericCode(int length)
    {
        var builder = new StringBuilder(length);
        for (var index = 0; index < length; index++)
        {
            builder.Append(RandomNumberGenerator.GetInt32(10));
        }

        return builder.ToString();
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
            Category = NormalizeCategoryForRole(user.RequestedRoleCode, user.Category),
            ApprovalStatus = user.ApprovalStatus.ToString(),
            IsActive = user.IsActive,
            RequestedAtUtc = user.RequestedAtUtc,
            CreatedAtUtc = user.CreatedAtUtc,
            ApprovedAtUtc = user.ApprovedAtUtc,
            ApprovedByUserId = user.ApprovedByUserId,
            IdentityAccessExpiresAtUtc = user.IdentityAccessExpiresAtUtc,
            IdentityLinkExpiresAtUtc = user.IdentityLinkExpiresAtUtc,
            Roles = user.UserRoles
                .Where(userRole => userRole.Role is not null && userRole.Role.IsActive)
                .Select(userRole => userRole.Role!.Code.ToUpperInvariant())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray()
        };
    }

    private static string NormalizeRequestedRole(string? requestedRole)
    {
        if (string.Equals(requestedRole, AdminRoleCode, StringComparison.OrdinalIgnoreCase))
        {
            return AdminRoleCode;
        }

        if (string.Equals(requestedRole, GuestRoleCode, StringComparison.OrdinalIgnoreCase))
        {
            return GuestRoleCode;
        }

        return UserRoleCode;
    }

    private static string NormalizeCategoryForRole(string roleCode, string? category)
    {
        if (string.Equals(roleCode, GuestRoleCode, StringComparison.OrdinalIgnoreCase))
        {
            return GuestCategory;
        }

        return NormalizeCategory(category);
    }

    private static string NormalizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return DefaultCategory;
        }

        var match = AllowedCategories.FirstOrDefault(allowedCategory =>
            string.Equals(allowedCategory, category.Trim(), StringComparison.OrdinalIgnoreCase)
            && !string.Equals(allowedCategory, GuestCategory, StringComparison.OrdinalIgnoreCase));

        return match ?? DefaultCategory;
    }

    private static string BuildGuestAlias(string email)
    {
        return BuildEmailAlias(email, "guest");
    }

    private static string BuildEmailAlias(string email, string fallback)
    {
        var localPart = email.Split('@', 2)[0].Trim();
        var chars = localPart
            .Where(char.IsLetterOrDigit)
            .Take(18)
            .ToArray();
        var alias = new string(chars).ToLowerInvariant();
        return string.IsNullOrWhiteSpace(alias) ? fallback : alias;
    }
    private static string BuildGuestFullName(string email)
    {
        var localPart = email.Split('@', 2)[0]
            .Replace('.', ' ')
            .Replace('_', ' ')
            .Trim();

        return string.IsNullOrWhiteSpace(localPart)
            ? "Guest User"
            : $"Guest {localPart}";
    }

    private static DateTime ToUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Local).ToUniversalTime()
        };
    }
}
