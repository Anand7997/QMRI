using Microsoft.EntityFrameworkCore;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;
using qMRI.Domain.Assessments.Entities;
using qMRI.Infrastructure.Persistence;
using AssessmentModule = qMRI.Domain.Assessments.Entities.Module;

namespace qMRI.Infrastructure.Assessments.Services;

public sealed class AssessmentCatalogService(qMRIDbContext dbContext) : IAssessmentCatalogService
{
    public async Task<IReadOnlyList<CategoryDto>> GetHierarchyAsync(
        bool includeInactive = false,
        bool includeQuestions = false,
        CancellationToken cancellationToken = default)
    {
        var categories = await dbContext.Categories
            .Include(category => category.Modules)
                .ThenInclude(module => module.SubModules)
                    .ThenInclude(subModule => subModule.Questions)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return categories
            .Where(category => includeInactive || category.IsActive)
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .Select(category => MapCategory(category, includeInactive, includeQuestions))
            .ToArray();
    }

    public async Task<QuestionListResponse> GetQuestionsAsync(
        QuestionListRequest request,
        CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        var query = dbContext.Questions
            .Include(question => question.SubModule)
                .ThenInclude(subModule => subModule!.Module)
                    .ThenInclude(module => module!.Category)
            .AsNoTracking()
            .AsQueryable();

        if (!request.IncludeInactive)
        {
            query = query.Where(question =>
                question.IsActive &&
                question.SubModule != null &&
                question.SubModule.IsActive &&
                question.SubModule.Module != null &&
                question.SubModule.Module.IsActive &&
                question.SubModule.Module.Category != null &&
                question.SubModule.Module.Category.IsActive);
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(question =>
                question.SubModule != null &&
                question.SubModule.Module != null &&
                question.SubModule.Module.CategoryId == request.CategoryId.Value);
        }

        if (request.ModuleId.HasValue)
        {
            query = query.Where(question =>
                question.SubModule != null &&
                question.SubModule.ModuleId == request.ModuleId.Value);
        }

        if (request.SubModuleId.HasValue)
        {
            query = query.Where(question => question.SubModuleId == request.SubModuleId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = $"%{request.Search.Trim()}%";
            query = query.Where(question =>
                EF.Functions.Like(question.Text, search) ||
                (question.Guidance != null && EF.Functions.Like(question.Guidance, search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(question => question.SubModule!.Module!.Category!.SortOrder)
            .ThenBy(question => question.SubModule!.Module!.SortOrder)
            .ThenBy(question => question.SubModule!.SortOrder)
            .ThenBy(question => question.SortOrder)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(question => new QuestionDto
            {
                QuestionId = question.QuestionId,
                SubModuleId = question.SubModuleId,
                SubModuleName = question.SubModule != null ? question.SubModule.Name : string.Empty,
                ModuleId = question.SubModule != null ? question.SubModule.ModuleId : Guid.Empty,
                ModuleName = question.SubModule != null && question.SubModule.Module != null ? question.SubModule.Module.Name : string.Empty,
                CategoryId = question.SubModule != null && question.SubModule.Module != null ? question.SubModule.Module.CategoryId : Guid.Empty,
                CategoryName = question.SubModule != null && question.SubModule.Module != null && question.SubModule.Module.Category != null
                    ? question.SubModule.Module.Category.Name
                    : string.Empty,
                Text = question.Text,
                Guidance = question.Guidance,
                ExpectedAnswer = question.ExpectedAnswer,
                Weight = question.Weight,
                SortOrder = question.SortOrder,
                IsActive = question.IsActive
            })
            .ToArrayAsync(cancellationToken);

        return new QuestionListResponse
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            Items = items
        };
    }

    public async Task<CategoryDto> CreateCategoryAsync(
        UpsertCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var category = new Category
        {
            CategoryId = Guid.NewGuid(),
            Code = NormalizeCode(request.Code, request.Name),
            Name = RequireName(request.Name),
            Description = NormalizeOptional(request.Description),
            SortOrder = request.SortOrder,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapCategory(category, includeInactive: true, includeQuestions: false);
    }

    public async Task<CategoryDto?> UpdateCategoryAsync(
        Guid categoryId,
        UpsertCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var category = await dbContext.Categories
            .Include(entity => entity.Modules)
                .ThenInclude(module => module.SubModules)
                    .ThenInclude(subModule => subModule.Questions)
            .SingleOrDefaultAsync(entity => entity.CategoryId == categoryId, cancellationToken);

        if (category is null)
        {
            return null;
        }

        category.Code = NormalizeCode(request.Code, request.Name);
        category.Name = RequireName(request.Name);
        category.Description = NormalizeOptional(request.Description);
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapCategory(category, includeInactive: true, includeQuestions: true);
    }

    public async Task<bool> DeleteCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default)
    {
        var category = await dbContext.Categories
            .Include(entity => entity.Modules)
                .ThenInclude(module => module.SubModules)
                    .ThenInclude(subModule => subModule.Questions)
            .SingleOrDefaultAsync(entity => entity.CategoryId == categoryId, cancellationToken);

        if (category is null)
        {
            return false;
        }

        category.IsActive = false;
        foreach (var module in category.Modules)
        {
            module.IsActive = false;
            foreach (var subModule in module.SubModules)
            {
                subModule.IsActive = false;
                foreach (var question in subModule.Questions)
                {
                    question.IsActive = false;
                }
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<ModuleDto> CreateModuleAsync(
        UpsertModuleRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);

        var module = new AssessmentModule
        {
            ModuleId = Guid.NewGuid(),
            CategoryId = request.CategoryId,
            Code = NormalizeCode(request.Code, request.Name),
            Name = RequireName(request.Name),
            Description = NormalizeOptional(request.Description),
            Weight = NormalizeWeight(request.Weight),
            SortOrder = request.SortOrder,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.Modules.Add(module);
        await dbContext.SaveChangesAsync(cancellationToken);

        return (await GetModuleDtoAsync(module.ModuleId, cancellationToken))!;
    }

    public async Task<ModuleDto?> UpdateModuleAsync(
        Guid moduleId,
        UpsertModuleRequest request,
        CancellationToken cancellationToken = default)
    {
        var module = await dbContext.Modules
            .Include(entity => entity.SubModules)
                .ThenInclude(subModule => subModule.Questions)
            .SingleOrDefaultAsync(entity => entity.ModuleId == moduleId, cancellationToken);

        if (module is null)
        {
            return null;
        }

        await EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);

        module.CategoryId = request.CategoryId;
        module.Code = NormalizeCode(request.Code, request.Name);
        module.Name = RequireName(request.Name);
        module.Description = NormalizeOptional(request.Description);
        module.Weight = NormalizeWeight(request.Weight);
        module.SortOrder = request.SortOrder;
        module.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetModuleDtoAsync(module.ModuleId, cancellationToken);
    }

    public async Task<bool> DeleteModuleAsync(Guid moduleId, CancellationToken cancellationToken = default)
    {
        var module = await dbContext.Modules
            .Include(entity => entity.SubModules)
                .ThenInclude(subModule => subModule.Questions)
            .SingleOrDefaultAsync(entity => entity.ModuleId == moduleId, cancellationToken);

        if (module is null)
        {
            return false;
        }

        module.IsActive = false;
        foreach (var subModule in module.SubModules)
        {
            subModule.IsActive = false;
            foreach (var question in subModule.Questions)
            {
                question.IsActive = false;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<SubModuleDto> CreateSubModuleAsync(
        UpsertSubModuleRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureModuleExistsAsync(request.ModuleId, cancellationToken);

        var subModule = new SubModule
        {
            SubModuleId = Guid.NewGuid(),
            ModuleId = request.ModuleId,
            Code = NormalizeCode(request.Code, request.Name),
            Name = RequireName(request.Name),
            Description = NormalizeOptional(request.Description),
            Weight = NormalizeWeight(request.Weight),
            SortOrder = request.SortOrder,
            IsActive = request.IsActive
        };

        dbContext.SubModules.Add(subModule);
        await dbContext.SaveChangesAsync(cancellationToken);

        return (await GetSubModuleDtoAsync(subModule.SubModuleId, cancellationToken))!;
    }

    public async Task<SubModuleDto?> UpdateSubModuleAsync(
        Guid subModuleId,
        UpsertSubModuleRequest request,
        CancellationToken cancellationToken = default)
    {
        var subModule = await dbContext.SubModules
            .Include(entity => entity.Questions)
            .SingleOrDefaultAsync(entity => entity.SubModuleId == subModuleId, cancellationToken);

        if (subModule is null)
        {
            return null;
        }

        await EnsureModuleExistsAsync(request.ModuleId, cancellationToken);

        subModule.ModuleId = request.ModuleId;
        subModule.Code = NormalizeCode(request.Code, request.Name);
        subModule.Name = RequireName(request.Name);
        subModule.Description = NormalizeOptional(request.Description);
        subModule.Weight = NormalizeWeight(request.Weight);
        subModule.SortOrder = request.SortOrder;
        subModule.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetSubModuleDtoAsync(subModule.SubModuleId, cancellationToken);
    }

    public async Task<bool> DeleteSubModuleAsync(Guid subModuleId, CancellationToken cancellationToken = default)
    {
        var subModule = await dbContext.SubModules
            .Include(entity => entity.Questions)
            .SingleOrDefaultAsync(entity => entity.SubModuleId == subModuleId, cancellationToken);

        if (subModule is null)
        {
            return false;
        }

        subModule.IsActive = false;
        foreach (var question in subModule.Questions)
        {
            question.IsActive = false;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<QuestionDto> CreateQuestionAsync(
        UpsertQuestionRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureSubModuleExistsAsync(request.SubModuleId, cancellationToken);

        var question = new Question
        {
            QuestionId = Guid.NewGuid(),
            SubModuleId = request.SubModuleId,
            Text = RequireName(request.Text),
            Guidance = NormalizeOptional(request.Guidance),
            ExpectedAnswer = request.ExpectedAnswer,
            Weight = NormalizeWeight(request.Weight),
            SortOrder = request.SortOrder,
            IsActive = request.IsActive
        };

        dbContext.Questions.Add(question);
        await dbContext.SaveChangesAsync(cancellationToken);

        return (await GetQuestionDtoAsync(question.QuestionId, cancellationToken))!;
    }

    public async Task<QuestionDto?> UpdateQuestionAsync(
        Guid questionId,
        UpsertQuestionRequest request,
        CancellationToken cancellationToken = default)
    {
        var question = await dbContext.Questions
            .SingleOrDefaultAsync(entity => entity.QuestionId == questionId, cancellationToken);

        if (question is null)
        {
            return null;
        }

        await EnsureSubModuleExistsAsync(request.SubModuleId, cancellationToken);

        question.SubModuleId = request.SubModuleId;
        question.Text = RequireName(request.Text);
        question.Guidance = NormalizeOptional(request.Guidance);
        question.ExpectedAnswer = request.ExpectedAnswer;
        question.Weight = NormalizeWeight(request.Weight);
        question.SortOrder = request.SortOrder;
        question.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetQuestionDtoAsync(question.QuestionId, cancellationToken);
    }

    public async Task<bool> DeleteQuestionAsync(Guid questionId, CancellationToken cancellationToken = default)
    {
        var question = await dbContext.Questions
            .SingleOrDefaultAsync(entity => entity.QuestionId == questionId, cancellationToken);

        if (question is null)
        {
            return false;
        }

        question.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<ModuleDto?> GetModuleDtoAsync(Guid moduleId, CancellationToken cancellationToken)
    {
        var module = await dbContext.Modules
            .Include(entity => entity.Category)
            .Include(entity => entity.SubModules)
                .ThenInclude(subModule => subModule.Questions)
            .AsNoTracking()
            .SingleOrDefaultAsync(entity => entity.ModuleId == moduleId, cancellationToken);

        return module is null ? null : MapModule(module, includeInactive: true, includeQuestions: true);
    }

    private async Task<SubModuleDto?> GetSubModuleDtoAsync(Guid subModuleId, CancellationToken cancellationToken)
    {
        var subModule = await dbContext.SubModules
            .Include(entity => entity.Module)
                .ThenInclude(module => module!.Category)
            .Include(entity => entity.Questions)
            .AsNoTracking()
            .SingleOrDefaultAsync(entity => entity.SubModuleId == subModuleId, cancellationToken);

        return subModule is null ? null : MapSubModule(subModule, includeInactive: true, includeQuestions: true);
    }

    private async Task<QuestionDto?> GetQuestionDtoAsync(Guid questionId, CancellationToken cancellationToken)
    {
        return await dbContext.Questions
            .Include(question => question.SubModule)
                .ThenInclude(subModule => subModule!.Module)
                    .ThenInclude(module => module!.Category)
            .AsNoTracking()
            .Where(question => question.QuestionId == questionId)
            .Select(question => new QuestionDto
            {
                QuestionId = question.QuestionId,
                SubModuleId = question.SubModuleId,
                SubModuleName = question.SubModule != null ? question.SubModule.Name : string.Empty,
                ModuleId = question.SubModule != null ? question.SubModule.ModuleId : Guid.Empty,
                ModuleName = question.SubModule != null && question.SubModule.Module != null ? question.SubModule.Module.Name : string.Empty,
                CategoryId = question.SubModule != null && question.SubModule.Module != null ? question.SubModule.Module.CategoryId : Guid.Empty,
                CategoryName = question.SubModule != null && question.SubModule.Module != null && question.SubModule.Module.Category != null
                    ? question.SubModule.Module.Category.Name
                    : string.Empty,
                Text = question.Text,
                Guidance = question.Guidance,
                ExpectedAnswer = question.ExpectedAnswer,
                Weight = question.Weight,
                SortOrder = question.SortOrder,
                IsActive = question.IsActive
            })
            .SingleOrDefaultAsync(cancellationToken);
    }

    private async Task EnsureCategoryExistsAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        var exists = await dbContext.Categories.AnyAsync(entity => entity.CategoryId == categoryId, cancellationToken);
        if (!exists)
        {
            throw new ArgumentException("Category does not exist.", nameof(categoryId));
        }
    }

    private async Task EnsureModuleExistsAsync(Guid moduleId, CancellationToken cancellationToken)
    {
        var exists = await dbContext.Modules.AnyAsync(entity => entity.ModuleId == moduleId, cancellationToken);
        if (!exists)
        {
            throw new ArgumentException("Module does not exist.", nameof(moduleId));
        }
    }

    private async Task EnsureSubModuleExistsAsync(Guid subModuleId, CancellationToken cancellationToken)
    {
        var exists = await dbContext.SubModules.AnyAsync(entity => entity.SubModuleId == subModuleId, cancellationToken);
        if (!exists)
        {
            throw new ArgumentException("Sub-module does not exist.", nameof(subModuleId));
        }
    }

    private static CategoryDto MapCategory(Category category, bool includeInactive, bool includeQuestions)
    {
        var modules = category.Modules
            .Where(module => includeInactive || module.IsActive)
            .OrderBy(module => module.SortOrder)
            .ThenBy(module => module.Name)
            .Select(module => MapModule(module, includeInactive, includeQuestions))
            .ToArray();

        return new CategoryDto
        {
            CategoryId = category.CategoryId,
            Code = category.Code,
            Name = category.Name,
            Description = category.Description,
            SortOrder = category.SortOrder,
            IsActive = category.IsActive,
            ModuleCount = modules.Length,
            SubModuleCount = modules.Sum(module => module.SubModuleCount),
            QuestionCount = modules.Sum(module => module.QuestionCount),
            Modules = modules
        };
    }

    private static ModuleDto MapModule(AssessmentModule module, bool includeInactive, bool includeQuestions)
    {
        var subModules = module.SubModules
            .Where(subModule => includeInactive || subModule.IsActive)
            .OrderBy(subModule => subModule.SortOrder)
            .ThenBy(subModule => subModule.Name)
            .Select(subModule => MapSubModule(subModule, includeInactive, includeQuestions))
            .ToArray();

        return new ModuleDto
        {
            ModuleId = module.ModuleId,
            CategoryId = module.CategoryId,
            CategoryName = module.Category?.Name ?? string.Empty,
            Code = module.Code,
            Name = module.Name,
            Description = module.Description,
            Weight = module.Weight,
            SortOrder = module.SortOrder,
            IsActive = module.IsActive,
            SubModuleCount = subModules.Length,
            QuestionCount = subModules.Sum(subModule => subModule.QuestionCount),
            SubModules = subModules
        };
    }

    private static SubModuleDto MapSubModule(SubModule subModule, bool includeInactive, bool includeQuestions)
    {
        var questions = subModule.Questions
            .Where(question => includeInactive || question.IsActive)
            .OrderBy(question => question.SortOrder)
            .ThenBy(question => question.Text)
            .Select(question => new QuestionDto
            {
                QuestionId = question.QuestionId,
                SubModuleId = question.SubModuleId,
                SubModuleName = subModule.Name,
                ModuleId = subModule.ModuleId,
                ModuleName = subModule.Module?.Name ?? string.Empty,
                CategoryId = subModule.Module?.CategoryId ?? Guid.Empty,
                CategoryName = subModule.Module?.Category?.Name ?? string.Empty,
                Text = question.Text,
                Guidance = question.Guidance,
                ExpectedAnswer = question.ExpectedAnswer,
                Weight = question.Weight,
                SortOrder = question.SortOrder,
                IsActive = question.IsActive
            })
            .ToArray();

        return new SubModuleDto
        {
            SubModuleId = subModule.SubModuleId,
            ModuleId = subModule.ModuleId,
            ModuleName = subModule.Module?.Name ?? string.Empty,
            CategoryId = subModule.Module?.CategoryId ?? Guid.Empty,
            CategoryName = subModule.Module?.Category?.Name ?? string.Empty,
            Code = subModule.Code,
            Name = subModule.Name,
            Description = subModule.Description,
            Weight = subModule.Weight,
            SortOrder = subModule.SortOrder,
            IsActive = subModule.IsActive,
            QuestionCount = questions.Length,
            Questions = includeQuestions ? questions : Array.Empty<QuestionDto>()
        };
    }

    private static string RequireName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("A non-empty value is required.");
        }

        return value.Trim();
    }

    private static string NormalizeCode(string code, string fallback)
    {
        var source = string.IsNullOrWhiteSpace(code) ? fallback : code;
        var normalized = new string(source
            .Trim()
            .ToUpperInvariant()
            .Select(character => char.IsLetterOrDigit(character) ? character : '_')
            .ToArray());

        while (normalized.Contains("__", StringComparison.Ordinal))
        {
            normalized = normalized.Replace("__", "_", StringComparison.Ordinal);
        }

        return normalized.Trim('_');
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static decimal NormalizeWeight(decimal weight)
    {
        return weight <= 0 ? 1 : weight;
    }
}
