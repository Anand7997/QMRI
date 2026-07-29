using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;
using qMRI.Domain.Assessments.Enums;

namespace qMRI.Api.Controllers;

[ApiController]
[Route("api/v1/assessments")]
[Authorize]
public sealed class AssessmentsController(
    IAssessmentExecutionService assessmentService,
    IQmriAgentAnalysisService agentAnalysisService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAssessments([FromQuery] Guid? userId, CancellationToken cancellationToken)
    {
        var currentUserId = TryGetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized();
        }

        if (userId.HasValue)
        {
            if (!User.IsInRole("ADMIN") && userId.Value != currentUserId.Value)
            {
                return Forbid();
            }

            var userAssessments = await assessmentService.GetAssessmentsAsync(userId.Value, cancellationToken);
            return Ok(userAssessments);
        }

        if (!User.IsInRole("ADMIN"))
        {
            var assignedAssessments = await assessmentService.GetAssessmentsForAssigneeAsync(currentUserId.Value, cancellationToken);
            return Ok(assignedAssessments);
        }

        var assessments = await assessmentService.GetAssessmentsAsync(cancellationToken: cancellationToken);
        return Ok(assessments);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CreateAssessment([FromBody] CreateAssessmentRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = TryGetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized();
        }

        request.AssignedByUserId = currentUserId;

        var assessment = await assessmentService.CreateAssessmentAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetAssessment), new { assessmentId = assessment.AssessmentId }, assessment);
    }

    [HttpGet("{assessmentId:guid}")]
    public async Task<IActionResult> GetAssessment(Guid assessmentId, CancellationToken cancellationToken)
    {
        var assessment = await assessmentService.GetAssessmentAsync(assessmentId, cancellationToken);
        if (assessment is null)
        {
            return NotFound();
        }

        var accessResult = EnsureOwnerAccess(assessment.Summary.UserId);
        if (accessResult is not null)
        {
            return accessResult;
        }

        return Ok(assessment);
    }

    [HttpGet("{assessmentId:guid}/exam-takers")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetExamTakers(Guid assessmentId, CancellationToken cancellationToken)
    {
        var examTakers = await assessmentService.GetExamTakersAsync(assessmentId, cancellationToken);
        return Ok(examTakers);
    }

    [HttpPost("{assessmentId:guid}/start")]
    public async Task<IActionResult> StartAssessment(Guid assessmentId, CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAssessmentAccessAsync(assessmentId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        var assessment = await assessmentService.StartAssessmentAsync(assessmentId, cancellationToken);
        return assessment is null ? NotFound() : Ok(assessment);
    }

    [HttpPut("{assessmentId:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateAssessment(Guid assessmentId, [FromBody] UpdateAssessmentRequest request, CancellationToken cancellationToken)
    {
        var assessment = await assessmentService.UpdateAssessmentAsync(assessmentId, request, cancellationToken);
        return assessment is null ? NotFound() : Ok(assessment);
    }

    [HttpDelete("{assessmentId:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteAssessment(Guid assessmentId, CancellationToken cancellationToken)
    {
        var deleted = await assessmentService.DeleteAssessmentAsync(assessmentId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPut("{assessmentId:guid}/responses")]
    public async Task<IActionResult> SaveResponse(Guid assessmentId, [FromBody] UpsertAssessmentResponseRequest request, CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAssessmentAccessAsync(assessmentId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        var response = await assessmentService.SaveResponseAsync(assessmentId, request, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPost("{assessmentId:guid}/submit")]
    public async Task<IActionResult> SubmitAssessment(Guid assessmentId, CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAssessmentAccessAsync(assessmentId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        var assessment = await assessmentService.SubmitAssessmentAsync(assessmentId, cancellationToken);
        return assessment is null ? NotFound() : Ok(assessment);
    }

    [HttpGet("{assessmentId:guid}/results")]
    public async Task<IActionResult> GetResults(Guid assessmentId, CancellationToken cancellationToken)
    {
        var assessment = await assessmentService.GetAssessmentAsync(assessmentId, cancellationToken);
        if (assessment is null)
        {
            return NotFound();
        }

        var accessResult = EnsureOwnerAccess(assessment.Summary.UserId);
        if (accessResult is not null)
        {
            return accessResult;
        }

        return Ok(new
        {
            assessment.Summary,
            assessment.Scores,
            assessment.Recommendations
        });
    }

    [HttpPost("{assessmentId:guid}/agent-analysis")]
    public async Task<IActionResult> AnalyzeWithQmriAgent(Guid assessmentId, CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAssessmentAccessAsync(assessmentId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        var assessment = await assessmentService.GetAssessmentAsync(assessmentId, cancellationToken);
        if (assessment is null)
        {
            return NotFound();
        }

        if (assessment.Summary.Status < AssessmentStatus.Scored || assessment.Scores.Count == 0)
        {
            return Problem(detail: "Submit and score the assessment before asking QMRI Agent to analyse it.", statusCode: StatusCodes.Status409Conflict);
        }

        var currentUserId = TryGetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized();
        }

        var safetyIdentifier = Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(currentUserId.Value.ToString("N"))))
            .ToLowerInvariant();

        try
        {
            var analysis = await agentAnalysisService.AnalyzeAsync(assessment, safetyIdentifier, cancellationToken);
            return Ok(analysis);
        }
        catch (QmriAgentAnalysisUnavailableException exception)
        {
            return Problem(detail: exception.Message, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private IActionResult? EnsureOwnerAccess(Guid ownerUserId)
    {
        if (User.IsInRole("ADMIN"))
        {
            return null;
        }

        var currentUserId = TryGetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized();
        }

        return currentUserId.Value == ownerUserId ? null : Forbid();
    }

    private async Task<IActionResult?> EnsureAssessmentAccessAsync(Guid assessmentId, CancellationToken cancellationToken)
    {
        if (User.IsInRole("ADMIN"))
        {
            return null;
        }

        var currentUserId = TryGetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized();
        }

        var ownerUserId = await assessmentService.GetAssessmentOwnerUserIdAsync(assessmentId, cancellationToken);
        if (!ownerUserId.HasValue)
        {
            return NotFound();
        }

        return currentUserId.Value == ownerUserId.Value ? null : Forbid();
    }

    private Guid? TryGetCurrentUserId()
    {
        var claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claimValue, out var userId) ? userId : null;
    }
}
