using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;

namespace qMRI.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/dashboard-governance")]
public sealed class DashboardGovernanceController(IDashboardGovernanceService governanceService) : ControllerBase
{
    [HttpGet("scoring-policy")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetScoringPolicy(CancellationToken cancellationToken)
    {
        return Ok(await governanceService.GetScoringPolicyAsync(cancellationToken));
    }

    [HttpPut("scoring-policy")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> SaveScoringPolicy([FromBody] DashboardScoringPolicyDto request, CancellationToken cancellationToken)
    {
        return Ok(await governanceService.UpsertScoringPolicyAsync(request, cancellationToken));
    }

    [HttpGet("intensity-templates")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetIntensityTemplates(CancellationToken cancellationToken)
    {
        return Ok(await governanceService.GetIntensityTemplateSettingsAsync(cancellationToken));
    }

    [HttpPut("intensity-templates")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> SaveIntensityTemplates([FromBody] DashboardIntensityTemplateSettingsDto request, CancellationToken cancellationToken)
    {
        return Ok(await governanceService.UpsertIntensityTemplateSettingsAsync(request, cancellationToken));
    }

    [HttpGet("reminder-preferences")]
    public async Task<IActionResult> GetReminderPreferences(CancellationToken cancellationToken)
    {
        var currentUserId = TryGetCurrentUserId();
        return currentUserId is null
            ? Unauthorized()
            : Ok(await governanceService.GetReminderPreferencesAsync(currentUserId.Value, cancellationToken));
    }

    [HttpPut("reminder-preferences")]
    public async Task<IActionResult> SaveReminderPreferences([FromBody] DashboardReminderPreferencesDto request, CancellationToken cancellationToken)
    {
        var currentUserId = TryGetCurrentUserId();
        return currentUserId is null
            ? Unauthorized()
            : Ok(await governanceService.UpsertReminderPreferencesAsync(currentUserId.Value, request, cancellationToken));
    }

    [HttpGet("resume-pointer")]
    public async Task<IActionResult> GetResumePointer(CancellationToken cancellationToken)
    {
        var currentUserId = TryGetCurrentUserId();
        return currentUserId is null
            ? Unauthorized()
            : Ok(await governanceService.GetResumePointerAsync(currentUserId.Value, cancellationToken));
    }

    [HttpPut("resume-pointer")]
    public async Task<IActionResult> SaveResumePointer([FromBody] UpsertDashboardResumePointerRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = TryGetCurrentUserId();
        return currentUserId is null
            ? Unauthorized()
            : Ok(await governanceService.UpsertResumePointerAsync(currentUserId.Value, request, cancellationToken));
    }

    [HttpDelete("resume-pointer")]
    public async Task<IActionResult> ClearResumePointer(CancellationToken cancellationToken)
    {
        var currentUserId = TryGetCurrentUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        return await governanceService.ClearResumePointerAsync(currentUserId.Value, cancellationToken) ? NoContent() : NotFound();
    }

    [HttpGet("audit-feed")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAuditFeed([FromQuery] int limit = 200, CancellationToken cancellationToken = default)
    {
        return Ok(await governanceService.GetAuditFeedAsync(limit, cancellationToken));
    }

    [HttpPost("audit-feed")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> AppendAuditFeed([FromBody] CreateGovernanceAuditEntryRequest request, CancellationToken cancellationToken)
    {
        return Ok(await governanceService.AppendAuditEntryAsync(request, cancellationToken));
    }

    [HttpDelete("audit-feed")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> ClearAuditFeed(CancellationToken cancellationToken)
    {
        await governanceService.ClearAuditFeedAsync(cancellationToken);
        return NoContent();
    }

    private Guid? TryGetCurrentUserId()
    {
        var claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claimValue, out var userId) ? userId : null;
    }
}
