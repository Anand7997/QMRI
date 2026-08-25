using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using qMRI.Application.Authentication.Abstractions;
using qMRI.Application.Authentication.DTOs;
using qMRI.Domain.Common.Entities;
using qMRI.Domain.Common.Enums;

namespace qMRI.Infrastructure.Authentication.Services;

public sealed class AuthenticationService(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IPasswordHashingService passwordHashingService,
    IJwtTokenGenerator jwtTokenGenerator,
    IRefreshTokenFactory refreshTokenFactory,
    IConfiguration configuration) : IAuthenticationService
{
    private const string AdminRoleCode = "ADMIN";
    private const string UserRoleCode = "USER";
    private const string GuestRoleCode = "GUEST";
    private const string ClientCategory = "Client";
    private readonly int _refreshTokenDays = configuration.GetValue<int?>("Jwt:RefreshTokenDays") ?? 7;

    public async Task<LoginResultDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.UserNameOrEmail) || string.IsNullOrWhiteSpace(request.Password))
        {
            return LoginResultDto.Failure(AuthenticationFailureReason.InvalidCredentials, "Invalid username/email or password.");
        }

        var user = await userRepository.GetByUserNameOrEmailWithRolesAsync(request.UserNameOrEmail, cancellationToken);
        if (user is null)
        {
            return LoginResultDto.Failure(AuthenticationFailureReason.InvalidCredentials, "Invalid username/email or password.");
        }

        var isPasswordValid = passwordHashingService.VerifyPassword(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            return LoginResultDto.Failure(AuthenticationFailureReason.InvalidCredentials, "Invalid username/email or password.");
        }

        var eligibilityFailure = ValidateLoginEligibility(user);
        if (eligibilityFailure is not null)
        {
            return eligibilityFailure;
        }

        return await CreateLoginResponseAsync(user, cancellationToken);
    }

    public async Task<LoginResultDto> LoginWithIdentityAccessAsync(IdentityAccessLoginRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.AccessCode))
        {
            return LoginResultDto.Failure(AuthenticationFailureReason.InvalidCredentials, "Enter the guest email and access code.");
        }

        var user = await userRepository.GetByEmailWithRolesAsync(request.Email, cancellationToken);
        if (user is null || !string.Equals(user.RequestedRoleCode, GuestRoleCode, StringComparison.OrdinalIgnoreCase))
        {
            return LoginResultDto.Failure(AuthenticationFailureReason.InvalidCredentials, "Invalid email or access code.");
        }

        var isAccessCodeValid = passwordHashingService.VerifyPassword(request.AccessCode, user.PasswordHash);
        if (!isAccessCodeValid)
        {
            return LoginResultDto.Failure(AuthenticationFailureReason.InvalidCredentials, "Invalid email or access code.");
        }

        var eligibilityFailure = ValidateLoginEligibility(user);
        if (eligibilityFailure is not null)
        {
            return eligibilityFailure;
        }

        return await CreateLoginResponseAsync(user, cancellationToken);
    }

    public async Task<LoginResultDto> LoginWithIdentityLinkAsync(IdentityLinkLoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var token = request.Token?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(token))
        {
            return LoginResultDto.Failure(AuthenticationFailureReason.InvalidCredentials, "Invalid identity link.");
        }

        var tokenHash = HashIdentityLinkToken(token);
        var user = await userRepository.GetByIdentityLinkTokenHashWithRolesAsync(tokenHash, cancellationToken);
        if (user is null || !string.Equals(user.RequestedRoleCode, UserRoleCode, StringComparison.OrdinalIgnoreCase))
        {
            return LoginResultDto.Failure(AuthenticationFailureReason.InvalidCredentials, "Invalid identity link.");
        }

        var nowUtc = DateTime.UtcNow;
        if (!user.IdentityLinkExpiresAtUtc.HasValue
            || user.IdentityLinkExpiresAtUtc.Value.ToUniversalTime() <= nowUtc)
        {
            return LoginResultDto.Failure(
                AuthenticationFailureReason.AccessDisabled,
                "This identity link has expired. Please contact your qMRI administrator.");
        }

        var eligibilityFailure = ValidateLoginEligibility(user);
        if (eligibilityFailure is not null)
        {
            return eligibilityFailure;
        }

        return await CreateLoginResponseAsync(user, cancellationToken);
    }
    public async Task<RegisterResultDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var fullName = request.FullName.Trim();
        var userName = request.UserName.Trim();
        var email = request.Email.Trim();
        var requestedRole = NormalizeRequestedRole(request.RequestedRole);

        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(email))
        {
            return RegisterResultDto.Failure(RegistrationFailureReason.Validation, "Full name, username and email are required.");
        }

        if (!email.Contains("@", StringComparison.Ordinal) || !email.Contains(".", StringComparison.Ordinal))
        {
            return RegisterResultDto.Failure(RegistrationFailureReason.Validation, "Enter a valid work email address.");
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
        {
            return RegisterResultDto.Failure(RegistrationFailureReason.Validation, "Password must be at least 8 characters.");
        }

        var exists = await userRepository.ExistsByUserNameOrEmailAsync(userName, email, cancellationToken);
        if (exists)
        {
            return RegisterResultDto.Failure(RegistrationFailureReason.DuplicateAccount, "An account with this username or email already exists.");
        }

        var nowUtc = DateTime.UtcNow;
        var user = new User
        {
            UserId = Guid.NewGuid(),
            FullName = fullName,
            UserName = userName,
            Email = email,
            PasswordHash = passwordHashingService.HashPassword(request.Password),
            IsActive = false,
            ApprovalStatus = UserApprovalStatus.Pending,
            RequestedRoleCode = requestedRole,
            RequestedAtUtc = nowUtc,
            CreatedAtUtc = nowUtc
        };

        await userRepository.AddAsync(user, cancellationToken);

        return RegisterResultDto.Success(new RegisterResponseDto
        {
            UserId = user.UserId,
            FullName = user.FullName,
            UserName = user.UserName,
            Email = user.Email,
            RequestedRoleCode = user.RequestedRoleCode,
            ApprovalStatus = user.ApprovalStatus.ToString(),
            Message = "Your request has been sent to an administrator. You can sign in after approval."
        });
    }

    public async Task<RegisterResultDto> RequestClientAccessAsync(ClientAccessRequestDto request, CancellationToken cancellationToken = default)
    {
        var email = request.Email?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(email))
        {
            return RegisterResultDto.Failure(RegistrationFailureReason.Validation, "Email is required.");
        }

        if (!IsEmailLike(email))
        {
            return RegisterResultDto.Failure(RegistrationFailureReason.Validation, "Enter a valid client email address.");
        }

        var exists = await userRepository.ExistsByUserNameOrEmailAsync(email, email, cancellationToken);
        if (exists)
        {
            return RegisterResultDto.Failure(RegistrationFailureReason.DuplicateAccount, "An account or request with this email already exists.");
        }

        var nowUtc = DateTime.UtcNow;
        var user = new User
        {
            UserId = Guid.NewGuid(),
            FullName = BuildClientFullName(email),
            UserName = BuildClientRequestUserName(),
            Email = email,
            PasswordHash = passwordHashingService.HashPassword(CreateRandomPassword()),
            IsActive = false,
            ApprovalStatus = UserApprovalStatus.Pending,
            RequestedRoleCode = UserRoleCode,
            Category = ClientCategory,
            RequestedAtUtc = nowUtc,
            CreatedAtUtc = nowUtc
        };

        await userRepository.AddAsync(user, cancellationToken);

        return RegisterResultDto.Success(new RegisterResponseDto
        {
            UserId = user.UserId,
            FullName = user.FullName,
            UserName = user.UserName,
            Email = user.Email,
            RequestedRoleCode = user.RequestedRoleCode,
            ApprovalStatus = user.ApprovalStatus.ToString(),
            Message = "Your request has been sent to the qMRI administrator for approval."
        });
    }

    private async Task<LoginResultDto> CreateLoginResponseAsync(User user, CancellationToken cancellationToken)
    {
        var roles = user.UserRoles
            .Where(userRole => userRole.Role is not null && userRole.Role.IsActive)
            .Select(userRole => userRole.Role!.Code.ToUpperInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (roles.Length == 0)
        {
            return LoginResultDto.Failure(
                AuthenticationFailureReason.AccessDisabled,
                "This account has not been assigned a portal role yet.");
        }

        var (accessToken, accessTokenExpiresAtUtc) = jwtTokenGenerator.GenerateAccessToken(user, roles);

        var refreshTokenValue = refreshTokenFactory.CreateToken();
        var refreshTokenExpiresAtUtc = DateTime.UtcNow.AddDays(_refreshTokenDays);
        if (user.IdentityAccessExpiresAtUtc is { } identityAccessExpiresAtUtc
            && string.Equals(user.RequestedRoleCode, GuestRoleCode, StringComparison.OrdinalIgnoreCase)
            && identityAccessExpiresAtUtc.ToUniversalTime() < refreshTokenExpiresAtUtc)
        {
            refreshTokenExpiresAtUtc = identityAccessExpiresAtUtc.ToUniversalTime();
        }

        var refreshToken = new RefreshToken
        {
            RefreshTokenId = Guid.NewGuid(),
            UserId = user.UserId,
            TokenHash = passwordHashingService.HashPassword(refreshTokenValue),
            ExpiresAtUtc = refreshTokenExpiresAtUtc,
            CreatedAtUtc = DateTime.UtcNow
        };

        await refreshTokenRepository.AddAsync(refreshToken, cancellationToken);

        return LoginResultDto.Success(new LoginResponseDto
        {
            AccessToken = accessToken,
            AccessTokenExpiresAtUtc = accessTokenExpiresAtUtc,
            RefreshToken = new RefreshTokenDto
            {
                Token = refreshTokenValue,
                ExpiresAtUtc = refreshTokenExpiresAtUtc
            },
            User = new AuthenticatedUserDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                UserName = user.UserName,
                Email = user.Email,
                ApprovalStatus = user.ApprovalStatus.ToString(),
                Roles = roles
            }
        });
    }

    private static LoginResultDto? ValidateLoginEligibility(User user)
    {
        if (user.ApprovalStatus == UserApprovalStatus.Pending)
        {
            return LoginResultDto.Failure(
                AuthenticationFailureReason.ApprovalPending,
                "Your request has been sent to an administrator and is waiting for approval.");
        }

        if (!user.IsActive || user.ApprovalStatus == UserApprovalStatus.Rejected)
        {
            return LoginResultDto.Failure(
                AuthenticationFailureReason.AccessDisabled,
                "This account is not active. Please contact your qMRI administrator.");
        }

        if (string.Equals(user.RequestedRoleCode, GuestRoleCode, StringComparison.OrdinalIgnoreCase)
            && (!user.IdentityAccessExpiresAtUtc.HasValue || user.IdentityAccessExpiresAtUtc.Value.ToUniversalTime() <= DateTime.UtcNow))
        {
            return LoginResultDto.Failure(
                AuthenticationFailureReason.AccessDisabled,
                "This identity access has expired. Please contact your qMRI administrator.");
        }

        return null;
    }

    public static string HashIdentityLinkToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token.Trim()));
        return Convert.ToHexString(bytes);
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

    private static bool IsEmailLike(string email)
    {
        return email.Contains("@", StringComparison.Ordinal) && email.Contains(".", StringComparison.Ordinal);
    }

    private static string BuildClientFullName(string email)
    {
        var localPart = email.Split('@', 2)[0]
            .Replace('.', ' ')
            .Replace('_', ' ')
            .Replace('-', ' ')
            .Trim();

        if (string.IsNullOrWhiteSpace(localPart))
        {
            return "Client";
        }

        var fullName = $"Client {localPart}";
        return fullName.Length <= 200 ? fullName : fullName[..200];
    }

    private static string BuildClientRequestUserName()
    {
        return $"client.{Guid.NewGuid():N}"[..39];
    }

    private static string CreateRandomPassword()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    }
}
