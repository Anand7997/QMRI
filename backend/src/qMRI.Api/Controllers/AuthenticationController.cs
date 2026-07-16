using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using qMRI.Application.Authentication.Abstractions;
using qMRI.Application.Authentication.DTOs;

namespace qMRI.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthenticationController(IAuthenticationService authenticationService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
    {
        var result = await authenticationService.LoginAsync(request, cancellationToken);
        return ToActionResult(result);
    }

    [AllowAnonymous]
    [HttpPost("identity-access/login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> LoginWithIdentityAccess([FromBody] IdentityAccessLoginRequestDto request, CancellationToken cancellationToken)
    {
        var result = await authenticationService.LoginWithIdentityAccessAsync(request, cancellationToken);
        return ToActionResult(result);
    }

    [AllowAnonymous]

    [HttpPost("identity-link/login")]

    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]

    [ProducesResponseType(StatusCodes.Status401Unauthorized)]

    [ProducesResponseType(StatusCodes.Status403Forbidden)]

    public async Task<IActionResult> LoginWithIdentityLink([FromBody] IdentityLinkLoginRequestDto request, CancellationToken cancellationToken)

    {

        var result = await authenticationService.LoginWithIdentityLinkAsync(request, cancellationToken);

        return ToActionResult(result);

    }



    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponseDto), StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request, CancellationToken cancellationToken)
    {
        var result = await authenticationService.RegisterAsync(request, cancellationToken);
        if (result.Response is not null)
        {
            return Accepted(result.Response);
        }

        return result.FailureReason == RegistrationFailureReason.DuplicateAccount
            ? Conflict(new { code = "DuplicateAccount", message = result.Message })
            : BadRequest(new { code = "Validation", message = result.Message });
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Me()
    {
        var roles = User.Claims
            .Where(claim => claim.Type == ClaimTypes.Role)
            .Select(claim => claim.Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return Ok(new
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            userName = User.Identity?.Name,
            email = User.FindFirstValue(ClaimTypes.Email),
            roles
        });
    }

    private IActionResult ToActionResult(LoginResultDto result)
    {
        if (result.Response is not null)
        {
            return Ok(result.Response);
        }

        return result.FailureReason switch
        {
            AuthenticationFailureReason.ApprovalPending => StatusCode(StatusCodes.Status403Forbidden, new
            {
                code = "ApprovalPending",
                message = result.Message
            }),
            AuthenticationFailureReason.AccessDisabled => StatusCode(StatusCodes.Status403Forbidden, new
            {
                code = "AccessDisabled",
                message = result.Message
            }),
            _ => Unauthorized(new
            {
                code = "InvalidCredentials",
                message = result.Message
            })
        };
    }
}
