using qMRI.Application.Authentication.DTOs;

namespace qMRI.Application.Authentication.Abstractions;

public interface IAuthenticationService
{
    Task<LoginResultDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);

    Task<LoginResultDto> LoginWithIdentityAccessAsync(IdentityAccessLoginRequestDto request, CancellationToken cancellationToken = default);



    Task<LoginResultDto> LoginWithIdentityLinkAsync(IdentityLinkLoginRequestDto request, CancellationToken cancellationToken = default);

    Task<RegisterResultDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
}
