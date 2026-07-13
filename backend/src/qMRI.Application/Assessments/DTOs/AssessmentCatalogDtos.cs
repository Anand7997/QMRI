using qMRI.Domain.Assessments.Enums;

namespace qMRI.Application.Assessments.DTOs;

public sealed class CategoryDto
{
    public Guid CategoryId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int ModuleCount { get; set; }
    public int SubModuleCount { get; set; }
    public int QuestionCount { get; set; }
    public IReadOnlyList<ModuleDto> Modules { get; set; } = Array.Empty<ModuleDto>();
}

public sealed class ModuleDto
{
    public Guid ModuleId { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Weight { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int SubModuleCount { get; set; }
    public int QuestionCount { get; set; }
    public IReadOnlyList<SubModuleDto> SubModules { get; set; } = Array.Empty<SubModuleDto>();
}

public sealed class SubModuleDto
{
    public Guid SubModuleId { get; set; }
    public Guid ModuleId { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Weight { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int QuestionCount { get; set; }
    public IReadOnlyList<QuestionDto> Questions { get; set; } = Array.Empty<QuestionDto>();
}

public sealed class QuestionDto
{
    public Guid QuestionId { get; set; }
    public Guid SubModuleId { get; set; }
    public string SubModuleName { get; set; } = string.Empty;
    public Guid ModuleId { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string? Guidance { get; set; }
    public AnswerOption ExpectedAnswer { get; set; }
    public decimal Weight { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

public sealed class QuestionListRequest
{
    public Guid? CategoryId { get; set; }
    public Guid? ModuleId { get; set; }
    public Guid? SubModuleId { get; set; }
    public string? Search { get; set; }
    public bool IncludeInactive { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public sealed class QuestionListResponse
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public IReadOnlyList<QuestionDto> Items { get; set; } = Array.Empty<QuestionDto>();
}

public sealed class UpsertCategoryRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class UpsertModuleRequest
{
    public Guid CategoryId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Weight { get; set; } = 1;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class UpsertSubModuleRequest
{
    public Guid ModuleId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Weight { get; set; } = 1;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class UpsertQuestionRequest
{
    public Guid SubModuleId { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? Guidance { get; set; }
    public AnswerOption ExpectedAnswer { get; set; }
    public decimal Weight { get; set; } = 1;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class AnswerOptionDto
{
    public AnswerOption Value { get; set; }
    public string Label { get; set; } = string.Empty;
}
