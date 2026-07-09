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

    private static string NormalizeRequestedRole(string? requestedRole)
    {
        return string.Equals(requestedRole, AdminRoleCode, StringComparison.OrdinalIgnoreCase)
            ? AdminRoleCode
            : UserRoleCode;
    }
}