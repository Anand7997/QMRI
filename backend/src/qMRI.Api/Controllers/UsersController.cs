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

    [HttpPost("identity-access")]
    [ProducesResponseType(typeof(CreateIdentityAccessResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateIdentityAccess(
        [FromBody] CreateIdentityAccessRequestDto request,
        CancellationToken cancellationToken)
    {
        var createdByUserId = TryGetCurrentUserId();
        if (createdByUserId is null)
        {
            return Unauthorized();
        }

        var result = await userAdministrationService.CreateIdentityAccessAsync(
            createdByUserId.Value,
            request,
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("identity-link")]
    [ProducesResponseType(typeof(CreateIdentityLinkResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateIdentityLink(
        [FromBody] CreateIdentityLinkRequestDto request,
        CancellationToken cancellationToken)
    {
        var createdByUserId = TryGetCurrentUserId();
        if (createdByUserId is null)
        {
            return Unauthorized();
        }

        var result = await userAdministrationService.CreateIdentityLinkAsync(
            createdByUserId.Value,
            request,
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, result);
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

        var user = await userAdministrationService.ApproveUserAsync(
            userId,
            approvedByUserId.Value,
            request?.RoleCode,
            request?.Category,
            cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost("{userId:guid}/approve-with-identity-link")]
    [ProducesResponseType(typeof(CreateIdentityLinkResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveUserWithIdentityLink(
        Guid userId,
        [FromBody] ApproveUserWithIdentityLinkRequestDto? request,
        CancellationToken cancellationToken)
    {
        var approvedByUserId = TryGetCurrentUserId();
        if (approvedByUserId is null)
        {
            return Unauthorized();
        }

        if (request is null)
        {
            return BadRequest(new { message = "Approval link request is required." });
        }

        var result = await userAdministrationService.ApproveUserWithIdentityLinkAsync(
            userId,
            approvedByUserId.Value,
            request,
            cancellationToken);

        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{userId:guid}/identity-link/email")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SendIdentityLinkEmail(
        Guid userId,
        [FromBody] SendIdentityLinkEmailRequestDto? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest(new { message = "Identity link email request is required." });
        }

        var sent = await userAdministrationService.SendIdentityLinkEmailAsync(
            userId,
            request,
            cancellationToken);

        return sent ? NoContent() : NotFound();
    }

    [HttpPut("{userId:guid}")]
    public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] UpdateUserAccessRequest request, CancellationToken cancellationToken)
    {
        var modifiedByUserId = TryGetCurrentUserId();
        if (modifiedByUserId is null)
        {
            return Unauthorized();
        }

        if (userId == modifiedByUserId.Value && !request.IsActive)
        {
            return BadRequest(new { message = "You cannot delete your own account." });
        }

        var user = await userAdministrationService.UpdateUserAccessAsync(
            userId,
            modifiedByUserId.Value,
            request.RoleCode,
            request.Category,
            request.IsActive,
            cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> DeactivateUser(Guid userId, CancellationToken cancellationToken)
    {
        var currentUserId = TryGetCurrentUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        if (userId == currentUserId.Value)
        {
            return BadRequest(new { message = "You cannot delete your own account." });
        }

        return await userAdministrationService.DeactivateUserAsync(userId, cancellationToken)
            ? NoContent()
            : NotFound();
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

    public string? Category { get; set; }
}

public sealed class UpdateUserAccessRequest
{
    public string? RoleCode { get; set; }

    public string? Category { get; set; }

    public bool IsActive { get; set; } = true;
}
