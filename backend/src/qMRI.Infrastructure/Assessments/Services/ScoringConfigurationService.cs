using Microsoft.EntityFrameworkCore;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;
using qMRI.Domain.Assessments.Entities;
using qMRI.Domain.Assessments.Enums;
using qMRI.Infrastructure.Persistence;

namespace qMRI.Infrastructure.Assessments.Services;

public sealed class ScoringConfigurationService(qMRIDbContext dbContext) : IScoringConfigurationService
{
    public async Task<IReadOnlyList<ScoringModelDto>> GetScoringModelsAsync(CancellationToken cancellationToken = default)
    {
        var models = await dbContext.ScoringModels
            .Include(model => model.Rules)
            .Include(model => model.MaturityBands)
            .AsNoTracking()
            .OrderByDescending(model => model.IsDefault)
            .ThenBy(model => model.Name)
            .ToArrayAsync(cancellationToken);

        return models.Select(MapModel).ToArray();
    }

    public async Task<ScoringModelDto?> GetScoringModelAsync(Guid scoringModelId, CancellationToken cancellationToken = default)
    {
        var model = await dbContext.ScoringModels
            .Include(entity => entity.Rules)
            .Include(entity => entity.MaturityBands)
            .AsNoTracking()
            .SingleOrDefaultAsync(entity => entity.ScoringModelId == scoringModelId, cancellationToken);

        return model is null ? null : MapModel(model);
    }

    public async Task<ScoringModelDto> CreateScoringModelAsync(
        UpsertScoringModelRequest request,
        CancellationToken cancellationToken = default)
    {
        var model = new ScoringModel
        {
            ScoringModelId = Guid.NewGuid(),
            Name = RequireName(request.Name),
            Description = NormalizeOptional(request.Description),
            IsActive = request.IsActive,
            IsDefault = request.IsDefault,
            CreatedAtUtc = DateTime.UtcNow
        };

        ApplyRules(model, request.Rules);
        ApplyBands(model, request.MaturityBands);

        if (model.IsDefault)
        {
            await ClearOtherDefaultsAsync(model.ScoringModelId, cancellationToken);
        }

        dbContext.ScoringModels.Add(model);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapModel(model);
    }

    public async Task<ScoringModelDto?> UpdateScoringModelAsync(
        Guid scoringModelId,
        UpsertScoringModelRequest request,
        CancellationToken cancellationToken = default)
    {
        var model = await dbContext.ScoringModels
            .Include(entity => entity.Rules)
            .Include(entity => entity.MaturityBands)
            .SingleOrDefaultAsync(entity => entity.ScoringModelId == scoringModelId, cancellationToken);

        if (model is null)
        {
            return null;
        }

        model.Name = RequireName(request.Name);
        model.Description = NormalizeOptional(request.Description);
        model.IsActive = request.IsActive;
        model.IsDefault = request.IsDefault;

        dbContext.ScoringRules.RemoveRange(model.Rules);
        dbContext.MaturityBands.RemoveRange(model.MaturityBands);
        model.Rules.Clear();
        model.MaturityBands.Clear();

        ApplyRules(model, request.Rules);
        ApplyBands(model, request.MaturityBands);

        if (model.IsDefault)
        {
            await ClearOtherDefaultsAsync(model.ScoringModelId, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapModel(model);
    }

    public async Task<ScoringModelDto> EnsureDefaultScoringModelAsync(CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.ScoringModels
            .Include(entity => entity.Rules)
            .Include(entity => entity.MaturityBands)
            .SingleOrDefaultAsync(entity => entity.ScoringModelId == AssessmentSeedDefaults.DefaultScoringModelId, cancellationToken);

        if (existing is not null)
        {
            if (!existing.IsDefault)
            {
                existing.IsDefault = true;
                await ClearOtherDefaultsAsync(existing.ScoringModelId, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            return MapModel(existing);
        }

        await ClearOtherDefaultsAsync(AssessmentSeedDefaults.DefaultScoringModelId, cancellationToken);

        var model = new ScoringModel
        {
            ScoringModelId = AssessmentSeedDefaults.DefaultScoringModelId,
            Name = AssessmentSeedDefaults.DefaultScoringModelName,
            Description = "Default TOPP scoring model for user answers: Yes=100, Partial=50, No=0.",
            IsActive = true,
            IsDefault = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        ApplyRules(model, Array.Empty<UpsertScoringRuleRequest>());
        ApplyBands(model, DefaultMaturityBands());

        dbContext.ScoringModels.Add(model);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapModel(model);
    }

    public async Task<bool> SetDefaultScoringModelAsync(Guid scoringModelId, CancellationToken cancellationToken = default)
    {
        var model = await dbContext.ScoringModels
            .SingleOrDefaultAsync(entity => entity.ScoringModelId == scoringModelId, cancellationToken);

        if (model is null)
        {
            return false;
        }

        await ClearOtherDefaultsAsync(model.ScoringModelId, cancellationToken);
        model.IsDefault = true;
        model.IsActive = true;

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task ClearOtherDefaultsAsync(Guid scoringModelId, CancellationToken cancellationToken)
    {
        var defaults = await dbContext.ScoringModels
            .Where(model => model.ScoringModelId != scoringModelId && model.IsDefault)
            .ToArrayAsync(cancellationToken);

        foreach (var model in defaults)
        {
            model.IsDefault = false;
        }
    }

    private static void ApplyRules(ScoringModel model, IReadOnlyList<UpsertScoringRuleRequest> requestedRules)
    {
        var rules = requestedRules.Count == 0
            ? DefaultRules()
            : requestedRules;

        foreach (var rule in rules
            .GroupBy(rule => rule.Answer)
            .Select(group => group.Last()))
        {
            model.Rules.Add(new ScoringRule
            {
                ScoringRuleId = Guid.NewGuid(),
                ScoringModelId = model.ScoringModelId,
                Answer = rule.Answer,
                Points = Math.Clamp(rule.Points, 0, 100)
            });
        }

        foreach (var answer in Enum.GetValues<AnswerOption>())
        {
            if (model.Rules.Any(rule => rule.Answer == answer))
            {
                continue;
            }

            var points = answer switch
            {
                AnswerOption.Yes => 100,
                AnswerOption.Partial => 50,
                _ => 0
            };

            model.Rules.Add(new ScoringRule
            {
                ScoringRuleId = Guid.NewGuid(),
                ScoringModelId = model.ScoringModelId,
                Answer = answer,
                Points = points
            });
        }
    }

    private static void ApplyBands(ScoringModel model, IReadOnlyList<UpsertMaturityBandRequest> requestedBands)
    {
        var bands = requestedBands.Count == 0
            ? DefaultMaturityBands()
            : requestedBands;

        foreach (var band in bands.OrderBy(band => band.SortOrder).ThenBy(band => band.MinScore))
        {
            model.MaturityBands.Add(new MaturityBand
            {
                MaturityBandId = Guid.NewGuid(),
                ScoringModelId = model.ScoringModelId,
                MinScore = Math.Clamp(band.MinScore, 0, 100),
                MaxScore = Math.Clamp(band.MaxScore, 0, 100),
                Level = RequireName(band.Level),
                Label = NormalizeOptional(band.Label),
                TmmiLevel = NormalizeOptional(band.TmmiLevel),
                SortOrder = band.SortOrder
            });
        }
    }

    private static IReadOnlyList<UpsertScoringRuleRequest> DefaultRules()
    {
        return new[]
        {
            new UpsertScoringRuleRequest { Answer = AnswerOption.No, Points = 0 },
            new UpsertScoringRuleRequest { Answer = AnswerOption.Partial, Points = 50 },
            new UpsertScoringRuleRequest { Answer = AnswerOption.Yes, Points = 100 }
        };
    }

    private static IReadOnlyList<UpsertMaturityBandRequest> DefaultMaturityBands()
    {
        return new[]
        {
            new UpsertMaturityBandRequest { MinScore = 0, MaxScore = 10, Level = "Testing", Label = "Initiating", TmmiLevel = "Initial", SortOrder = 1 },
            new UpsertMaturityBandRequest { MinScore = 11, MaxScore = 20, Level = "Testing", Label = "Diagnosing", TmmiLevel = "Initial", SortOrder = 2 },
            new UpsertMaturityBandRequest { MinScore = 21, MaxScore = 30, Level = "Testing", Label = "Diagnosing", TmmiLevel = "Managed", SortOrder = 3 },
            new UpsertMaturityBandRequest { MinScore = 31, MaxScore = 40, Level = "QA", Label = "Establishing", TmmiLevel = "Defined", SortOrder = 4 },
            new UpsertMaturityBandRequest { MinScore = 41, MaxScore = 50, Level = "QA", Label = "Establishing", TmmiLevel = "Defined", SortOrder = 5 },
            new UpsertMaturityBandRequest { MinScore = 51, MaxScore = 60, Level = "QA", Label = "Establishing", TmmiLevel = "Defined", SortOrder = 6 },
            new UpsertMaturityBandRequest { MinScore = 61, MaxScore = 70, Level = "QE", Label = "Acting", TmmiLevel = "Measured", SortOrder = 7 },
            new UpsertMaturityBandRequest { MinScore = 71, MaxScore = 80, Level = "QE", Label = "Acting", TmmiLevel = "Optimization", SortOrder = 8 },
            new UpsertMaturityBandRequest { MinScore = 81, MaxScore = 90, Level = "IQ", Label = "Learning", TmmiLevel = "Level-5", SortOrder = 9 },
            new UpsertMaturityBandRequest { MinScore = 91, MaxScore = 100, Level = "IQ", Label = "Learning", TmmiLevel = "Level-5", SortOrder = 10 }
        };
    }

    private static ScoringModelDto MapModel(ScoringModel model)
    {
        return new ScoringModelDto
        {
            ScoringModelId = model.ScoringModelId,
            Name = model.Name,
            Description = model.Description,
            IsActive = model.IsActive,
            IsDefault = model.IsDefault,
            CreatedAtUtc = model.CreatedAtUtc,
            Rules = model.Rules
                .OrderBy(rule => rule.Answer)
                .Select(rule => new ScoringRuleDto
                {
                    ScoringRuleId = rule.ScoringRuleId,
                    Answer = rule.Answer,
                    Points = rule.Points
                })
                .ToArray(),
            MaturityBands = model.MaturityBands
                .OrderBy(band => band.SortOrder)
                .ThenBy(band => band.MinScore)
                .Select(band => new MaturityBandDto
                {
                    MaturityBandId = band.MaturityBandId,
                    MinScore = band.MinScore,
                    MaxScore = band.MaxScore,
                    Level = band.Level,
                    Label = band.Label,
                    TmmiLevel = band.TmmiLevel,
                    SortOrder = band.SortOrder
                })
                .ToArray()
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

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
