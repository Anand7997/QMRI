using Microsoft.AspNetCore.Mvc;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;

namespace qMRI.Api.Controllers;

[ApiController]
[Route("api/v1/admin/seed")]
public sealed class SeedController(IAssessmentSeedService seedService) : ControllerBase
{
    [HttpPost("topp")]
    public async Task<IActionResult> SeedToppAssessment([FromBody] SeedAssessmentRequest? request, CancellationToken cancellationToken)
    {
        var result = await seedService.SeedToppAssessmentAsync(request ?? new SeedAssessmentRequest(), cancellationToken);
        return Ok(result);
    }
}
