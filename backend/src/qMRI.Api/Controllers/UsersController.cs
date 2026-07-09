using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using qMRI.Application.Authentication.Abstractions;
using qMRI.Application.Authentication.DTOs;
using qMRI.Domain.Common.Enums;

namespace qMRI.Api.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN")]
[Route("api/v1/users")]
public sealed class UsersController(IUserAdministrationService userAdministrationService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<UserAccessRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsers([FromQuery] string? status, CancellationToken cancellationToken)
    {
        if (!TryParseStatus(status, out var approvalStatus))
        {
            return BadRequest(new
            {
                code = "InvalidStatus",
                message = "Status must be pending, approved, rejected or omitted."
            });
        }

        var users = await userAdministrationService.GetUsersAsync(approvalStatus, cancellationToken);
        return Ok(users);
    }

    [HttpPost("{userId:guid}/approve")]
    [ProducesResponseType(typeof(UserAccessRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveUser(Guid userId, [FromBody] ApproveUserRequest? request, CancellationToken cancellationToken)
    {
        var approvedByUserId = TryGetCurrentUserId();
        if (approvedByUserId is null)
        {
            return Unauthorized();
        }

        var user = await userAdministrationService.ApproveUserAsync(userId, approvedByUserId.Value, request?.RoleCode, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    private static bool TryParseStatus(string? status, out UserApprovalStatus? approvalStatus)
    {
        approvalStatus = null;

        if (string.IsNullOrWhiteSpace(status) || status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (Enum.TryParse<UserApprovalStatus>(status, ignoreCase: true, out var parsed))
        {
            approvalStatus = parsed;
            return true;
        }

        return false;
    }

    private Guid? TryGetCurrentUserId()
    {
        var claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claimValue, out var userId) ? userId : null;
    }
}

public sealed class ApproveUserRequest
{
    public string? RoleCode { get; set; }
}
