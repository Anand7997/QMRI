using Microsoft.AspNetCore.Mvc;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;

namespace qMRI.Api.Controllers;

[ApiController]
[Route("api/v1/scoring-models")]
public sealed class ScoringModelsController(IScoringConfigurationService scoringService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetScoringModels(CancellationToken cancellationToken)
    {
        var models = await scoringService.GetScoringModelsAsync(cancellationToken);
        return Ok(models);
    }

    [HttpGet("default")]
    public async Task<IActionResult> GetDefaultScoringModel(CancellationToken cancellationToken)
    {
        var model = await scoringService.EnsureDefaultScoringModelAsync(cancellationToken);
        return Ok(model);
    }

    [HttpGet("{scoringModelId:guid}")]
    public async Task<IActionResult> GetScoringModel(Guid scoringModelId, CancellationToken cancellationToken)
    {
        var model = await scoringService.GetScoringModelAsync(scoringModelId, cancellationToken);
        return model is null ? NotFound() : Ok(model);
    }

    [HttpPost]
    public async Task<IActionResult> CreateScoringModel([FromBody] UpsertScoringModelRequest request, CancellationToken cancellationToken)
    {
        var model = await scoringService.CreateScoringModelAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetScoringModel), new { scoringModelId = model.ScoringModelId }, model);
    }

    [HttpPut("{scoringModelId:guid}")]
    public async Task<IActionResult> UpdateScoringModel(Guid scoringModelId, [FromBody] UpsertScoringModelRequest request, CancellationToken cancellationToken)
    {
        var model = await scoringService.UpdateScoringModelAsync(scoringModelId, request, cancellationToken);
        return model is null ? NotFound() : Ok(model);
    }

    [HttpPut("{scoringModelId:guid}/default")]
    public async Task<IActionResult> SetDefaultScoringModel(Guid scoringModelId, CancellationToken cancellationToken)
    {
        var updated = await scoringService.SetDefaultScoringModelAsync(scoringModelId, cancellationToken);
        return updated ? NoContent() : NotFound();
    }
}
