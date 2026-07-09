using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;
using qMRI.Application.Authentication.Abstractions;
using qMRI.Domain.Assessments.Entities;
using qMRI.Domain.Assessments.Enums;
using qMRI.Domain.Common.Entities;
using qMRI.Infrastructure.Persistence;
using AssessmentModule = qMRI.Domain.Assessments.Entities.Module;

namespace qMRI.Infrastructure.Assessments.Services;

public sealed class AssessmentSeedService(
    qMRIDbContext dbContext,
    IScoringConfigurationService scoringConfigurationService,
    IPasswordHashingService passwordHashingService,
    IConfiguration configuration) : IAssessmentSeedService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<SeedAssessmentResultDto> SeedToppAssessmentAsync(
        SeedAssessmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var seedFile = await LoadSeedFileAsync(cancellationToken);
        var result = new SeedAssessmentResultDto();
        var existingQuestionCount = await dbContext.Questions.CountAsync(cancellationToken);

        await EnsureDefaultUsersAsync(result, cancellationToken);
        await EnsureDefaultScoringAsync(seedFile, request.OverwriteExisting, result, cancellationToken);
        await SeedHierarchyAsync(seedFile, request.OverwriteExisting, result, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        result.SeedAlreadyPresent =
            existingQuestionCount >= seedFile.Categories
                .SelectMany(category => category.Modules)
                .SelectMany(module => module.SubModules)
                .Sum(subModule => subModule.Questions.Count);

        return result;
    }

    private async Task EnsureDefaultUsersAsync(SeedAssessmentResultDto result, CancellationToken cancellationToken)
    {
        if (!await dbContext.Roles.AnyAsync(role => role.RoleId == AssessmentSeedDefaults.AdminRoleId, cancellationToken))
        {
            dbContext.Roles.Add(new Role
            {
                RoleId = AssessmentSeedDefaults.AdminRoleId,
                Code = AssessmentSeedDefaults.AdminRoleCode,
                Name = "Administrator",
                IsActive = true
            });
        }

        if (!await dbContext.Roles.AnyAsync(role => role.RoleId == AssessmentSeedDefaults.AssessmentUserRoleId, cancellationToken))
        {
            dbContext.Roles.Add(new Role
            {
                RoleId = AssessmentSeedDefaults.AssessmentUserRoleId,
                Code = AssessmentSeedDefaults.AssessmentUserRoleCode,
                Name = "Assessment User",
                IsActive = true
            });
        }

        var adminCreated = await EnsureUserAsync(
            AssessmentSeedDefaults.AdminUserId,
            "admin",
            "admin@qmri.local",
            configuration["SeedData:DefaultAdminPassword"] ?? "Admin@123!",
            new[] { AssessmentSeedDefaults.AdminRoleId, AssessmentSeedDefaults.AssessmentUserRoleId },
            cancellationToken);

        var userCreated = await EnsureUserAsync(
            AssessmentSeedDefaults.AssessmentUserId,
            "assessor",
            "assessor@qmri.local",
            configuration["SeedData:DefaultAssessorPassword"] ?? "User@123!",
            new[] { AssessmentSeedDefaults.AssessmentUserRoleId },
            cancellationToken);

        result.UsersCreated += adminCreated ? 1 : 0;
        result.UsersCreated += userCreated ? 1 : 0;
    }

    private async Task<bool> EnsureUserAsync(
        Guid userId,
        string userName,
        string email,
        string password,
        IReadOnlyList<Guid> roleIds,
        CancellationToken cancellationToken)
    {
        var created = false;
        var user = await dbContext.Users.SingleOrDefaultAsync(entity => entity.UserId == userId, cancellationToken);
        if (user is null)
        {
            user = new User
            {
                UserId = userId,
                UserName = userName,
                Email = email,
                PasswordHash = passwordHashingService.HashPassword(password),
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };

            dbContext.Users.Add(user);
            created = true;
        }

        foreach (var roleId in roleIds)
        {
            var hasRole = await dbContext.UserRoles
                .AnyAsync(entity => entity.UserId == userId && entity.RoleId == roleId, cancellationToken);

            if (!hasRole)
            {
                dbContext.UserRoles.Add(new UserRole
                {
                    UserId = userId,
                    RoleId = roleId,
                    AssignedAtUtc = DateTime.UtcNow
                });
            }
        }

        return created;
    }

    private async Task EnsureDefaultScoringAsync(
        ToppSeedFile seedFile,
        bool overwriteExisting,
        SeedAssessmentResultDto result,
        CancellationToken cancellationToken)
    {
        var modelExisted = await dbContext.ScoringModels
            .AnyAsync(model => model.ScoringModelId == AssessmentSeedDefaults.DefaultScoringModelId, cancellationToken);

        await scoringConfigurationService.EnsureDefaultScoringModelAsync(cancellationToken);

        if (!modelExisted)
        {
            result.ScoringModelsCreated++;
        }

        if (!overwriteExisting)
        {
            return;
        }

        var model = await dbContext.ScoringModels
            .Include(entity => entity.MaturityBands)
            .Include(entity => entity.Rules)
            .SingleAsync(entity => entity.ScoringModelId == AssessmentSeedDefaults.DefaultScoringModelId, cancellationToken);

        model.Name = AssessmentSeedDefaults.DefaultScoringModelName;
        model.Description = "Default TOPP scoring model seeded from the Quinnox IQ scoring workbook.";
        model.IsDefault = true;
        model.IsActive = true;

        dbContext.MaturityBands.RemoveRange(model.MaturityBands);
        dbContext.ScoringRules.RemoveRange(model.Rules);
        model.MaturityBands.Clear();
        model.Rules.Clear();

        model.Rules.Add(new ScoringRule { ScoringRuleId = Guid.NewGuid(), ScoringModelId = model.ScoringModelId, Answer = AnswerOption.No, Points = 0 });
        model.Rules.Add(new ScoringRule { ScoringRuleId = Guid.NewGuid(), ScoringModelId = model.ScoringModelId, Answer = AnswerOption.Partial, Points = 50 });
        model.Rules.Add(new ScoringRule { ScoringRuleId = Guid.NewGuid(), ScoringModelId = model.ScoringModelId, Answer = AnswerOption.Yes, Points = 100 });

        foreach (var band in seedFile.MaturityBands)
        {
            model.MaturityBands.Add(new MaturityBand
            {
                MaturityBandId = band.MaturityBandId,
                ScoringModelId = model.ScoringModelId,
                MinScore = band.MinScore,
                MaxScore = band.MaxScore,
                Level = band.Level,
                Label = band.Label,
                TmmiLevel = band.TmmiLevel,
                SortOrder = band.SortOrder
            });
        }

        result.RecordsUpdated++;
    }

    private async Task SeedHierarchyAsync(
        ToppSeedFile seedFile,
        bool overwriteExisting,
        SeedAssessmentResultDto result,
        CancellationToken cancellationToken)
    {
        var categoryIds = seedFile.Categories.Select(category => category.CategoryId).ToArray();
        var moduleIds = seedFile.Categories.SelectMany(category => category.Modules).Select(module => module.ModuleId).ToArray();
        var subModuleIds = seedFile.Categories.SelectMany(category => category.Modules).SelectMany(module => module.SubModules).Select(subModule => subModule.SubModuleId).ToArray();
        var questionIds = seedFile.Categories.SelectMany(category => category.Modules).SelectMany(module => module.SubModules).SelectMany(subModule => subModule.Questions).Select(question => question.QuestionId).ToArray();

        var existingCategories = await dbContext.Categories
            .Where(category => categoryIds.Contains(category.CategoryId))
            .ToDictionaryAsync(category => category.CategoryId, cancellationToken);

        var existingModules = await dbContext.Modules
            .Where(module => moduleIds.Contains(module.ModuleId))
            .ToDictionaryAsync(module => module.ModuleId, cancellationToken);

        var existingSubModules = await dbContext.SubModules
            .Where(subModule => subModuleIds.Contains(subModule.SubModuleId))
            .ToDictionaryAsync(subModule => subModule.SubModuleId, cancellationToken);

        var existingQuestions = await dbContext.Questions
            .Where(question => questionIds.Contains(question.QuestionId))
            .ToDictionaryAsync(question => question.QuestionId, cancellationToken);

        foreach (var seedCategory in seedFile.Categories)
        {
            var isNewCategory = false;
            if (!existingCategories.TryGetValue(seedCategory.CategoryId, out var category))
            {
                category = new Category
                {
                    CategoryId = seedCategory.CategoryId,
                    CreatedAtUtc = DateTime.UtcNow,
                    IsActive = true
                };
                dbContext.Categories.Add(category);
                result.CategoriesCreated++;
                isNewCategory = true;
            }

            if (overwriteExisting || isNewCategory)
            {
                category.Code = seedCategory.Code;
                category.Name = seedCategory.Name;
                category.Description = seedCategory.Description;
                category.SortOrder = seedCategory.SortOrder;
                category.IsActive = true;
            }

            foreach (var seedModule in seedCategory.Modules)
            {
                var isNewModule = false;
                if (!existingModules.TryGetValue(seedModule.ModuleId, out var module))
                {
                    module = new AssessmentModule
                    {
                        ModuleId = seedModule.ModuleId,
                        CategoryId = seedCategory.CategoryId,
                        CreatedAtUtc = DateTime.UtcNow,
                        IsActive = true
                    };
                    dbContext.Modules.Add(module);
                    result.ModulesCreated++;
                    isNewModule = true;
                }

                if (overwriteExisting || isNewModule)
                {
                    module.CategoryId = seedCategory.CategoryId;
                    module.Code = seedModule.Code;
                    module.Name = seedModule.Name;
                    module.Description = seedModule.Description;
                    module.Weight = seedModule.Weight <= 0 ? 1 : seedModule.Weight;
                    module.SortOrder = seedModule.SortOrder;
                    module.IsActive = true;
                }

                foreach (var seedSubModule in seedModule.SubModules)
                {
                    var isNewSubModule = false;
                    if (!existingSubModules.TryGetValue(seedSubModule.SubModuleId, out var subModule))
                    {
                        subModule = new SubModule
                        {
                            SubModuleId = seedSubModule.SubModuleId,
                            ModuleId = seedModule.ModuleId,
                            IsActive = true
                        };
                        dbContext.SubModules.Add(subModule);
                        result.SubModulesCreated++;
                        isNewSubModule = true;
                    }

                    if (overwriteExisting || isNewSubModule)
                    {
                        subModule.ModuleId = seedModule.ModuleId;
                        subModule.Code = seedSubModule.Code;
                        subModule.Name = seedSubModule.Name;
                        subModule.Description = seedSubModule.Description;
                        subModule.Weight = seedSubModule.Weight <= 0 ? 1 : seedSubModule.Weight;
                        subModule.SortOrder = seedSubModule.SortOrder;
                        subModule.IsActive = true;
                    }

                    foreach (var seedQuestion in seedSubModule.Questions)
                    {
                        var isNewQuestion = false;
                        if (!existingQuestions.TryGetValue(seedQuestion.QuestionId, out var question))
                        {
                            question = new Question
                            {
                                QuestionId = seedQuestion.QuestionId,
                                SubModuleId = seedSubModule.SubModuleId,
                                IsActive = true
                            };
                            dbContext.Questions.Add(question);
                            result.QuestionsCreated++;
                            isNewQuestion = true;
                        }

                        if (overwriteExisting || isNewQuestion)
                        {
                            question.SubModuleId = seedSubModule.SubModuleId;
                            question.Text = seedQuestion.Text;
                            question.Guidance = seedQuestion.Guidance;
                            question.Weight = seedQuestion.Weight <= 0 ? 1 : seedQuestion.Weight;
                            question.SortOrder = seedQuestion.SortOrder;
                            question.IsActive = true;
                        }
                    }
                }
            }
        }

        if (overwriteExisting)
        {
            result.RecordsUpdated += existingCategories.Count + existingModules.Count + existingSubModules.Count + existingQuestions.Count;
        }
    }

    private static async Task<ToppSeedFile> LoadSeedFileAsync(CancellationToken cancellationToken)
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = assembly
            .GetManifestResourceNames()
            .SingleOrDefault(name => name.EndsWith("topp-assessment-seed.json", StringComparison.OrdinalIgnoreCase));

        if (resourceName is null)
        {
            throw new InvalidOperationException("TOPP assessment seed data was not embedded in qMRI.Infrastructure.");
        }

        await using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException("TOPP assessment seed data could not be opened.");

        var seedFile = await JsonSerializer.DeserializeAsync<ToppSeedFile>(stream, JsonOptions, cancellationToken);
        return seedFile ?? throw new InvalidOperationException("TOPP assessment seed data could not be parsed.");
    }

    private sealed class ToppSeedFile
    {
        public string Source { get; set; } = string.Empty;
        public IReadOnlyList<CategorySeed> Categories { get; set; } = Array.Empty<CategorySeed>();
        public IReadOnlyList<MaturityBandSeed> MaturityBands { get; set; } = Array.Empty<MaturityBandSeed>();
    }

    private sealed class CategorySeed
    {
        public Guid CategoryId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int SortOrder { get; set; }
        public IReadOnlyList<ModuleSeed> Modules { get; set; } = Array.Empty<ModuleSeed>();
    }

    private sealed class ModuleSeed
    {
        public Guid ModuleId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Weight { get; set; }
        public int SortOrder { get; set; }
        public IReadOnlyList<SubModuleSeed> SubModules { get; set; } = Array.Empty<SubModuleSeed>();
    }

    private sealed class SubModuleSeed
    {
        public Guid SubModuleId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Weight { get; set; }
        public int SortOrder { get; set; }
        public IReadOnlyList<QuestionSeed> Questions { get; set; } = Array.Empty<QuestionSeed>();
    }

    private sealed class QuestionSeed
    {
        public Guid QuestionId { get; set; }
        public string Text { get; set; } = string.Empty;
        public string? Guidance { get; set; }
        public decimal Weight { get; set; }
        public int SortOrder { get; set; }
    }

    private sealed class MaturityBandSeed
    {
        public Guid MaturityBandId { get; set; }
        public decimal MinScore { get; set; }
        public decimal MaxScore { get; set; }
        public string Level { get; set; } = string.Empty;
        public string? Label { get; set; }
        public string? TmmiLevel { get; set; }
        public int SortOrder { get; set; }
    }
}



