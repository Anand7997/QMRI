using qMRI.Application.Assessments.DTOs;

namespace qMRI.Application.Assessments.Abstractions;

public interface IAssessmentCatalogService
{
    Task<IReadOnlyList<CategoryDto>> GetHierarchyAsync(
        bool includeInactive = false,
        bool includeQuestions = false,
        CancellationToken cancellationToken = default);

    Task<QuestionListResponse> GetQuestionsAsync(
        QuestionListRequest request,
        CancellationToken cancellationToken = default);

    Task<CategoryDto> CreateCategoryAsync(
        UpsertCategoryRequest request,
        CancellationToken cancellationToken = default);

    Task<CategoryDto?> UpdateCategoryAsync(
        Guid categoryId,
        UpsertCategoryRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);

    Task<ModuleDto> CreateModuleAsync(
        UpsertModuleRequest request,
        CancellationToken cancellationToken = default);

    Task<ModuleDto?> UpdateModuleAsync(
        Guid moduleId,
        UpsertModuleRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteModuleAsync(Guid moduleId, CancellationToken cancellationToken = default);

    Task<SubModuleDto> CreateSubModuleAsync(
        UpsertSubModuleRequest request,
        CancellationToken cancellationToken = default);

    Task<SubModuleDto?> UpdateSubModuleAsync(
        Guid subModuleId,
        UpsertSubModuleRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteSubModuleAsync(Guid subModuleId, CancellationToken cancellationToken = default);

    Task<QuestionDto> CreateQuestionAsync(
        UpsertQuestionRequest request,
        CancellationToken cancellationToken = default);

    Task<QuestionDto?> UpdateQuestionAsync(
        Guid questionId,
        UpsertQuestionRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteQuestionAsync(Guid questionId, CancellationToken cancellationToken = default);
}
