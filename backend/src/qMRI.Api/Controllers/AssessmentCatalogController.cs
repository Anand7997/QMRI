using Microsoft.AspNetCore.Mvc;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;

namespace qMRI.Api.Controllers;

[ApiController]
[Route("api/v1/assessment-catalog")]
public sealed class AssessmentCatalogController(IAssessmentCatalogService catalogService) : ControllerBase
{
    [HttpGet("tree")]
    public async Task<IActionResult> GetHierarchy(
        [FromQuery] bool includeInactive = false,
        [FromQuery] bool includeQuestions = false,
        CancellationToken cancellationToken = default)
    {
        var hierarchy = await catalogService.GetHierarchyAsync(includeInactive, includeQuestions, cancellationToken);
        return Ok(hierarchy);
    }

    [HttpGet("questions")]
    public async Task<IActionResult> GetQuestions([FromQuery] QuestionListRequest request, CancellationToken cancellationToken)
    {
        var questions = await catalogService.GetQuestionsAsync(request, cancellationToken);
        return Ok(questions);
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] UpsertCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await catalogService.CreateCategoryAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetHierarchy), new { includeInactive = true }, category);
    }

    [HttpPut("categories/{categoryId:guid}")]
    public async Task<IActionResult> UpdateCategory(Guid categoryId, [FromBody] UpsertCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await catalogService.UpdateCategoryAsync(categoryId, request, cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }

    [HttpDelete("categories/{categoryId:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid categoryId, CancellationToken cancellationToken)
    {
        var deleted = await catalogService.DeleteCategoryAsync(categoryId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("modules")]
    public async Task<IActionResult> CreateModule([FromBody] UpsertModuleRequest request, CancellationToken cancellationToken)
    {
        var module = await catalogService.CreateModuleAsync(request, cancellationToken);
        return Ok(module);
    }

    [HttpPut("modules/{moduleId:guid}")]
    public async Task<IActionResult> UpdateModule(Guid moduleId, [FromBody] UpsertModuleRequest request, CancellationToken cancellationToken)
    {
        var module = await catalogService.UpdateModuleAsync(moduleId, request, cancellationToken);
        return module is null ? NotFound() : Ok(module);
    }

    [HttpDelete("modules/{moduleId:guid}")]
    public async Task<IActionResult> DeleteModule(Guid moduleId, CancellationToken cancellationToken)
    {
        var deleted = await catalogService.DeleteModuleAsync(moduleId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("submodules")]
    public async Task<IActionResult> CreateSubModule([FromBody] UpsertSubModuleRequest request, CancellationToken cancellationToken)
    {
        var subModule = await catalogService.CreateSubModuleAsync(request, cancellationToken);
        return Ok(subModule);
    }

    [HttpPut("submodules/{subModuleId:guid}")]
    public async Task<IActionResult> UpdateSubModule(Guid subModuleId, [FromBody] UpsertSubModuleRequest request, CancellationToken cancellationToken)
    {
        var subModule = await catalogService.UpdateSubModuleAsync(subModuleId, request, cancellationToken);
        return subModule is null ? NotFound() : Ok(subModule);
    }

    [HttpDelete("submodules/{subModuleId:guid}")]
    public async Task<IActionResult> DeleteSubModule(Guid subModuleId, CancellationToken cancellationToken)
    {
        var deleted = await catalogService.DeleteSubModuleAsync(subModuleId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("questions")]
    public async Task<IActionResult> CreateQuestion([FromBody] UpsertQuestionRequest request, CancellationToken cancellationToken)
    {
        var question = await catalogService.CreateQuestionAsync(request, cancellationToken);
        return Ok(question);
    }

    [HttpPut("questions/{questionId:guid}")]
    public async Task<IActionResult> UpdateQuestion(Guid questionId, [FromBody] UpsertQuestionRequest request, CancellationToken cancellationToken)
    {
        var question = await catalogService.UpdateQuestionAsync(questionId, request, cancellationToken);
        return question is null ? NotFound() : Ok(question);
    }

    [HttpDelete("questions/{questionId:guid}")]
    public async Task<IActionResult> DeleteQuestion(Guid questionId, CancellationToken cancellationToken)
    {
        var deleted = await catalogService.DeleteQuestionAsync(questionId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
