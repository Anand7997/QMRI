using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;

namespace qMRI.Api.Controllers;

[ApiController]
[Route("api/v1/assessments")]
public sealed class AssessmentsController(IAssessmentExecutionService assessmentService) : ControllerBase
{
    private static readonly Guid DefaultAssessmentUserId = Guid.Parse("30000000-0000-0000-0000-000000000202");

    [HttpGet]
    public async Task<IActionResult> GetAssessments([FromQuery] Guid? userId, CancellationToken cancellationToken)
    {
        var resolvedUserId = userId ?? TryGetCurrentUserId();
        var assessments = await assessmentService.GetAssessmentsAsync(resolvedUserId, cancellationToken);
        return Ok(assessments);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAssessment([FromBody] CreateAssessmentRequest request, CancellationToken cancellationToken)
    {
        request.UserId = TryGetCurrentUserId() ?? request.UserId ?? DefaultAssessmentUserId;
        var assessment = await assessmentService.CreateAssessmentAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetAssessment), new { assessmentId = assessment.AssessmentId }, assessment);
    }

    [HttpGet("{assessmentId:guid}")]
    public async Task<IActionResult> GetAssessment(Guid assessmentId, CancellationToken cancellationToken)
    {
        var assessment = await assessmentService.GetAssessmentAsync(assessmentId, cancellationToken);
        return assessment is null ? NotFound() : Ok(assessment);
    }

    [HttpPut("{assessmentId:guid}")]
    public async Task<IActionResult> UpdateAssessment(Guid assessmentId, [FromBody] UpdateAssessmentRequest request, CancellationToken cancellationToken)
    {
        var assessment = await assessmentService.UpdateAssessmentAsync(assessmentId, request, cancellationToken);
        return assessment is null ? NotFound() : Ok(assessment);
    }

    [HttpDelete("{assessmentId:guid}")]
    public async Task<IActionResult> DeleteAssessment(Guid assessmentId, CancellationToken cancellationToken)
    {
        var deleted = await assessmentService.DeleteAssessmentAsync(assessmentId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
    [HttpPut("{assessmentId:guid}/responses")]
    public async Task<IActionResult> SaveResponse(Guid assessmentId, [FromBody] UpsertAssessmentResponseRequest request, CancellationToken cancellationToken)
    {
        var response = await assessmentService.SaveResponseAsync(assessmentId, request, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPost("{assessmentId:guid}/submit")]
    public async Task<IActionResult> SubmitAssessment(Guid assessmentId, CancellationToken cancellationToken)
    {
        var assessment = await assessmentService.SubmitAssessmentAsync(assessmentId, cancellationToken);
        return assessment is null ? NotFound() : Ok(assessment);
    }

    [HttpGet("{assessmentId:guid}/results")]
    public async Task<IActionResult> GetResults(Guid assessmentId, CancellationToken cancellationToken)
    {
        var assessment = await assessmentService.GetAssessmentAsync(assessmentId, cancellationToken);
        return assessment is null ? NotFound() : Ok(new
        {
            assessment.Summary,
            assessment.Scores,
            assessment.Recommendations
        });
    }

    private Guid? TryGetCurrentUserId()
    {
        var claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claimValue, out var userId) ? userId : null;
    }
}
