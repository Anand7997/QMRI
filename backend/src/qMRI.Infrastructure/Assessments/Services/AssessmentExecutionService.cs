using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;
using qMRI.Domain.Assessments.Entities;
using qMRI.Domain.Assessments.Enums;
using qMRI.Infrastructure.Persistence;

namespace qMRI.Infrastructure.Assessments.Services;

public sealed class AssessmentExecutionService(
    qMRIDbContext dbContext,
    IScoringConfigurationService scoringConfigurationService) : IAssessmentExecutionService
{
    public async Task<AssessmentSummaryDto> CreateAssessmentAsync(
        CreateAssessmentRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!request.UserId.HasValue)
        {
            throw new ArgumentException("A user id is required to create an assessment.");
        }

        var userExists = await dbContext.Users.AnyAsync(user => user.UserId == request.UserId.Value, cancellationToken);
        if (!userExists)
        {
            throw new ArgumentException("The requested assessment user does not exist.");
        }

        var scoringModelId = request.ScoringModelId
            ?? (await scoringConfigurationService.EnsureDefaultScoringModelAsync(cancellationToken)).ScoringModelId;

        var scoringModelExists = await dbContext.ScoringModels
            .AnyAsync(model => model.ScoringModelId == scoringModelId && model.IsActive, cancellationToken);

        if (!scoringModelExists)
        {
            throw new ArgumentException("The requested scoring model does not exist or is inactive.");
        }

        var selectedDepartments = NormalizeDepartments(request.Departments);
        if (selectedDepartments.Length == 0)
        {
            throw new ArgumentException("Select at least one department for this assessment.");
        }

        var selectedQuestionIds = request.QuestionIds.Distinct().ToArray();
        if (selectedQuestionIds.Length == 0)
        {
            throw new ArgumentException("Select at least one assessment question.");
        }

        var validQuestionIds = await GetValidQuestionIdsAsync(selectedQuestionIds, cancellationToken);
        if (validQuestionIds.Length != selectedQuestionIds.Length)
        {
            throw new ArgumentException("One or more selected questions are inactive or do not exist.");
        }

        var now = DateTime.UtcNow;
        var assessment = new Assessment
        {
            AssessmentId = Guid.NewGuid(),
            UserId = request.UserId.Value,
            ScoringModelId = scoringModelId,
            Title = string.IsNullOrWhiteSpace(request.Title) ? "qMRI TOPP Assessment" : request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Departments = SerializeStringList(selectedDepartments),
            SelectedQuestionIds = SerializeGuidList(validQuestionIds),
            Status = AssessmentStatus.InProgress,
            StartedAtUtc = now,
            CreatedAtUtc = now
        };

        dbContext.Assessments.Add(assessment);
        await dbContext.SaveChangesAsync(cancellationToken);

        var questionCount = await CountAssessmentQuestionsAsync(assessment, cancellationToken);
        return MapSummary(assessment, questionCount);
    }

    public async Task<IReadOnlyList<AssessmentSummaryDto>> GetAssessmentsAsync(
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Assessments
            .Include(assessment => assessment.Responses)
            .Include(assessment => assessment.Scores)
            .AsNoTracking()
            .AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(assessment => assessment.UserId == userId.Value);
        }

        var assessments = await query
            .OrderByDescending(assessment => assessment.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);

        return await MapSummariesAsync(assessments, cancellationToken);
    }

    public async Task<AssessmentDetailDto?> GetAssessmentAsync(Guid assessmentId, CancellationToken cancellationToken = default)
    {
        var assessment = await LoadAssessmentDetailQuery()
            .AsNoTracking()
            .SingleOrDefaultAsync(entity => entity.AssessmentId == assessmentId, cancellationToken);

        if (assessment is null)
        {
            return null;
        }

        var questionCount = await CountAssessmentQuestionsAsync(assessment, cancellationToken);
        return MapDetail(assessment, questionCount);
    }

    public async Task<AssessmentSummaryDto?> UpdateAssessmentAsync(
        Guid assessmentId,
        UpdateAssessmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var assessment = await dbContext.Assessments
            .Include(entity => entity.Responses)
            .Include(entity => entity.Scores)
            .SingleOrDefaultAsync(entity => entity.AssessmentId == assessmentId, cancellationToken);

        if (assessment is null)
        {
            return null;
        }

        assessment.Title = string.IsNullOrWhiteSpace(request.Title)
            ? "qMRI TOPP Assessment"
            : request.Title.Trim();
        assessment.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);

        var questionCount = await CountAssessmentQuestionsAsync(assessment, cancellationToken);
        return MapSummary(assessment, questionCount);
    }

    public async Task<bool> DeleteAssessmentAsync(Guid assessmentId, CancellationToken cancellationToken = default)
    {
        var assessment = await dbContext.Assessments
            .SingleOrDefaultAsync(entity => entity.AssessmentId == assessmentId, cancellationToken);

        if (assessment is null)
        {
            return false;
        }

        dbContext.Assessments.Remove(assessment);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<AssessmentResponseDto?> SaveResponseAsync(
        Guid assessmentId,
        UpsertAssessmentResponseRequest request,
        CancellationToken cancellationToken = default)
    {
        var assessment = await dbContext.Assessments
            .SingleOrDefaultAsync(entity => entity.AssessmentId == assessmentId, cancellationToken);

        if (assessment is null)
        {
            return null;
        }

        if (assessment.Status is AssessmentStatus.Submitted or AssessmentStatus.Scored or AssessmentStatus.Archived)
        {
            throw new InvalidOperationException("Responses are locked after an assessment is submitted.");
        }

        var question = await dbContext.Questions
            .AsNoTracking()
            .SingleOrDefaultAsync(entity => entity.QuestionId == request.QuestionId && entity.IsActive, cancellationToken);

        if (question is null)
        {
            throw new ArgumentException("The requested active question does not exist.");
        }

        if (!IsQuestionSelected(assessment, request.QuestionId))
        {
            throw new ArgumentException("The requested question is not part of this assessment.");
        }

        var scoringModelId = assessment.ScoringModelId
            ?? (await scoringConfigurationService.EnsureDefaultScoringModelAsync(cancellationToken)).ScoringModelId;

        var points = await dbContext.ScoringRules
            .Where(rule => rule.ScoringModelId == scoringModelId && rule.Answer == request.Answer)
            .Select(rule => rule.Points)
            .SingleOrDefaultAsync(cancellationToken);

        var response = await dbContext.AssessmentResponses
            .SingleOrDefaultAsync(entity =>
                entity.AssessmentId == assessmentId &&
                entity.QuestionId == request.QuestionId,
                cancellationToken);

        var now = DateTime.UtcNow;
        if (response is null)
        {
            response = new AssessmentResponse
            {
                AssessmentResponseId = Guid.NewGuid(),
                AssessmentId = assessmentId,
                QuestionId = request.QuestionId
            };

            dbContext.AssessmentResponses.Add(response);
        }

        response.Answer = request.Answer;
        response.Points = points;
        response.Findings = string.IsNullOrWhiteSpace(request.Findings) ? null : request.Findings.Trim();
        response.AnsweredAtUtc = now;

        assessment.Status = AssessmentStatus.InProgress;
        assessment.StartedAtUtc ??= now;

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapResponse(response);
    }

    public async Task<AssessmentDetailDto?> SubmitAssessmentAsync(Guid assessmentId, CancellationToken cancellationToken = default)
    {
        var assessment = await dbContext.Assessments
            .SingleOrDefaultAsync(entity => entity.AssessmentId == assessmentId, cancellationToken);

        if (assessment is null)
        {
            return null;
        }

        if (assessment.Status == AssessmentStatus.Archived)
        {
            throw new InvalidOperationException("Archived assessments cannot be submitted.");
        }

        var now = DateTime.UtcNow;
        assessment.Status = AssessmentStatus.Submitted;
        assessment.SubmittedAtUtc ??= now;

        await RecalculateScoresAsync(assessment, cancellationToken);

        assessment.Status = AssessmentStatus.Scored;
        assessment.ScoredAtUtc = now;

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAssessmentAsync(assessmentId, cancellationToken);
    }

    private IQueryable<Assessment> LoadAssessmentDetailQuery()
    {
        return dbContext.Assessments
            .Include(assessment => assessment.Responses)
            .Include(assessment => assessment.Scores)
                .ThenInclude(score => score.Category)
            .Include(assessment => assessment.Scores)
                .ThenInclude(score => score.Module)
            .Include(assessment => assessment.Scores)
                .ThenInclude(score => score.SubModule)
            .Include(assessment => assessment.Recommendations)
                .ThenInclude(recommendation => recommendation.Category)
            .Include(assessment => assessment.Recommendations)
                .ThenInclude(recommendation => recommendation.Module);
    }

    private async Task RecalculateScoresAsync(Assessment assessment, CancellationToken cancellationToken)
    {
        var activeQuestions = await dbContext.Questions
            .Include(question => question.SubModule)
                .ThenInclude(subModule => subModule!.Module)
                    .ThenInclude(module => module!.Category)
            .Where(question =>
                question.IsActive &&
                question.SubModule != null &&
                question.SubModule.IsActive &&
                question.SubModule.Module != null &&
                question.SubModule.Module.IsActive &&
                question.SubModule.Module.Category != null &&
                question.SubModule.Module.Category.IsActive)
            .AsNoTracking()
            .ToArrayAsync(cancellationToken);

        var selectedQuestionIds = GetSelectedQuestionIds(assessment);
        if (selectedQuestionIds.Count > 0)
        {
            activeQuestions = activeQuestions
                .Where(question => selectedQuestionIds.Contains(question.QuestionId))
                .ToArray();
        }

        var responses = await dbContext.AssessmentResponses
            .Where(response => response.AssessmentId == assessment.AssessmentId)
            .AsNoTracking()
            .ToDictionaryAsync(response => response.QuestionId, cancellationToken);

        var existingScores = await dbContext.AssessmentScores
            .Where(score => score.AssessmentId == assessment.AssessmentId)
            .ToArrayAsync(cancellationToken);

        var existingRecommendations = await dbContext.Recommendations
            .Where(recommendation => recommendation.AssessmentId == assessment.AssessmentId)
            .ToArrayAsync(cancellationToken);

        dbContext.AssessmentScores.RemoveRange(existingScores);
        dbContext.Recommendations.RemoveRange(existingRecommendations);

        var bands = await dbContext.MaturityBands
            .Where(band => band.ScoringModelId == assessment.ScoringModelId)
            .AsNoTracking()
            .OrderBy(band => band.SortOrder)
            .ToArrayAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var items = activeQuestions
            .Select(question =>
            {
                responses.TryGetValue(question.QuestionId, out var response);
                var weight = question.Weight <= 0 ? 1 : question.Weight;

                return new ScoreItem(
                    question.SubModule!.Module!.CategoryId,
                    question.SubModule.Module.Category!.Name,
                    question.SubModule.ModuleId,
                    question.SubModule.Module.Name,
                    question.SubModuleId,
                    question.SubModule.Name,
                    response is not null,
                    response?.Points ?? 0,
                    weight);
            })
            .ToArray();

        var scores = new List<AssessmentScore>();

        scores.Add(CreateScore(
            assessment.AssessmentId,
            ScoreScope.Overall,
            items,
            bands,
            now));

        scores.AddRange(items
            .GroupBy(item => new { item.CategoryId, item.CategoryName })
            .Select(group => CreateScore(
                assessment.AssessmentId,
                ScoreScope.Category,
                group,
                bands,
                now,
                categoryId: group.Key.CategoryId)));

        scores.AddRange(items
            .GroupBy(item => new { item.CategoryId, item.ModuleId, item.ModuleName })
            .Select(group => CreateScore(
                assessment.AssessmentId,
                ScoreScope.Module,
                group,
                bands,
                now,
                categoryId: group.Key.CategoryId,
                moduleId: group.Key.ModuleId)));

        scores.AddRange(items
            .GroupBy(item => new { item.CategoryId, item.ModuleId, item.SubModuleId, item.SubModuleName })
            .Select(group => CreateScore(
                assessment.AssessmentId,
                ScoreScope.SubModule,
                group,
                bands,
                now,
                categoryId: group.Key.CategoryId,
                moduleId: group.Key.ModuleId,
                subModuleId: group.Key.SubModuleId)));

        dbContext.AssessmentScores.AddRange(scores);

        var recommendations = scores
            .Where(score => score.Scope is ScoreScope.Category or ScoreScope.Module)
            .Where(score => score.Score < 70)
            .Select(score => CreateRecommendation(assessment.AssessmentId, score, now))
            .ToArray();

        dbContext.Recommendations.AddRange(recommendations);
    }

    private static AssessmentScore CreateScore(
        Guid assessmentId,
        ScoreScope scope,
        IEnumerable<ScoreItem> scopeItems,
        IReadOnlyList<MaturityBand> bands,
        DateTime calculatedAtUtc,
        Guid? categoryId = null,
        Guid? moduleId = null,
        Guid? subModuleId = null)
    {
        var items = scopeItems.ToArray();
        var totalWeight = items.Sum(item => item.Weight);
        var score = totalWeight == 0
            ? 0
            : Math.Round(items.Sum(item => item.Points * item.Weight) / totalWeight, 2, MidpointRounding.AwayFromZero);

        return new AssessmentScore
        {
            AssessmentScoreId = Guid.NewGuid(),
            AssessmentId = assessmentId,
            Scope = scope,
            CategoryId = categoryId,
            ModuleId = moduleId,
            SubModuleId = subModuleId,
            Score = score,
            AnsweredCount = items.Count(item => item.IsAnswered),
            QuestionCount = items.Length,
            MaturityLevel = ResolveMaturityLevel(score, bands),
            CalculatedAtUtc = calculatedAtUtc
        };
    }

    private static Recommendation CreateRecommendation(Guid assessmentId, AssessmentScore score, DateTime createdAtUtc)
    {
        var priority = score.Score < 40
            ? RecommendationPriority.High
            : RecommendationPriority.Medium;

        var scopeLabel = score.Scope == ScoreScope.Category ? "category" : "module";
        var title = score.Scope == ScoreScope.Category
            ? "Improve category maturity"
            : "Improve module maturity";

        return new Recommendation
        {
            RecommendationId = Guid.NewGuid(),
            AssessmentId = assessmentId,
            CategoryId = score.CategoryId,
            ModuleId = score.ModuleId,
            Title = title,
            Description = $"The {scopeLabel} score is {score.Score:0.##}. Review unanswered or low-confidence areas and prioritize improvement actions for this scope.",
            Priority = priority,
            CreatedAtUtc = createdAtUtc
        };
    }

    private static string ResolveMaturityLevel(decimal score, IReadOnlyList<MaturityBand> bands)
    {
        var band = bands.FirstOrDefault(item => score >= item.MinScore && score <= item.MaxScore);
        if (band is null)
        {
            return score switch
            {
                >= 81 => "IQ",
                >= 61 => "QE",
                >= 31 => "QA",
                _ => "Testing"
            };
        }

        return string.IsNullOrWhiteSpace(band.Label)
            ? band.Level
            : $"{band.Level} - {band.Label}";
    }

    private async Task<AssessmentSummaryDto[]> MapSummariesAsync(
        IReadOnlyCollection<Assessment> assessments,
        CancellationToken cancellationToken)
    {
        var summaries = new List<AssessmentSummaryDto>(assessments.Count);
        foreach (var assessment in assessments)
        {
            summaries.Add(MapSummary(assessment, await CountAssessmentQuestionsAsync(assessment, cancellationToken)));
        }

        return summaries.ToArray();
    }

    private async Task<int> CountAssessmentQuestionsAsync(Assessment assessment, CancellationToken cancellationToken)
    {
        var selectedQuestionIds = GetSelectedQuestionIds(assessment);
        if (selectedQuestionIds.Count > 0)
        {
            return await dbContext.Questions.CountAsync(question => question.IsActive && selectedQuestionIds.Contains(question.QuestionId), cancellationToken);
        }

        return await dbContext.Questions.CountAsync(question => question.IsActive, cancellationToken);
    }

    private async Task<Guid[]> GetValidQuestionIdsAsync(IReadOnlyCollection<Guid> questionIds, CancellationToken cancellationToken)
    {
        return await dbContext.Questions
            .Where(question =>
                questionIds.Contains(question.QuestionId) &&
                question.IsActive &&
                question.SubModule != null &&
                question.SubModule.IsActive &&
                question.SubModule.Module != null &&
                question.SubModule.Module.IsActive &&
                question.SubModule.Module.Category != null &&
                question.SubModule.Module.Category.IsActive)
            .Select(question => question.QuestionId)
            .ToArrayAsync(cancellationToken);
    }

    private static bool IsQuestionSelected(Assessment assessment, Guid questionId)
    {
        var selectedQuestionIds = GetSelectedQuestionIds(assessment);
        return selectedQuestionIds.Count == 0 || selectedQuestionIds.Contains(questionId);
    }

    private static HashSet<Guid> GetSelectedQuestionIds(Assessment assessment)
    {
        if (string.IsNullOrWhiteSpace(assessment.SelectedQuestionIds))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<Guid[]>(assessment.SelectedQuestionIds)?.ToHashSet() ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string[] GetDepartments(Assessment assessment)
    {
        if (string.IsNullOrWhiteSpace(assessment.Departments))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<string[]>(assessment.Departments) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string[] NormalizeDepartments(IEnumerable<string> departments)
    {
        return departments
            .Where(department => !string.IsNullOrWhiteSpace(department))
            .Select(department => department.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static string SerializeGuidList(IEnumerable<Guid> values) => JsonSerializer.Serialize(values.Distinct().ToArray());

    private static string SerializeStringList(IEnumerable<string> values) => JsonSerializer.Serialize(NormalizeDepartments(values));

    private static AssessmentSummaryDto MapSummary(Assessment assessment, int questionCount)
    {
        var selectedQuestionIds = GetSelectedQuestionIds(assessment);
        var overall = assessment.Scores.FirstOrDefault(score => score.Scope == ScoreScope.Overall);
        var answeredCount = assessment.Responses
            .Where(response => selectedQuestionIds.Count == 0 || selectedQuestionIds.Contains(response.QuestionId))
            .Select(response => response.QuestionId)
            .Distinct()
            .Count();

        return new AssessmentSummaryDto
        {
            AssessmentId = assessment.AssessmentId,
            UserId = assessment.UserId,
            ScoringModelId = assessment.ScoringModelId,
            Title = assessment.Title,
            Description = assessment.Description,
            Departments = GetDepartments(assessment),
            QuestionIds = selectedQuestionIds.ToArray(),
            Status = assessment.Status,
            StartedAtUtc = assessment.StartedAtUtc,
            SubmittedAtUtc = assessment.SubmittedAtUtc,
            ScoredAtUtc = assessment.ScoredAtUtc,
            CreatedAtUtc = assessment.CreatedAtUtc,
            AnsweredCount = answeredCount,
            QuestionCount = questionCount,
            CompletionPercentage = questionCount == 0
                ? 0
                : Math.Round(answeredCount * 100m / questionCount, 2, MidpointRounding.AwayFromZero),
            OverallScore = overall?.Score,
            OverallMaturityLevel = overall?.MaturityLevel
        };
    }

    private static AssessmentDetailDto MapDetail(Assessment assessment, int questionCount)
    {
        return new AssessmentDetailDto
        {
            Summary = MapSummary(assessment, questionCount),
            Responses = assessment.Responses
                .OrderBy(response => response.AnsweredAtUtc)
                .Select(MapResponse)
                .ToArray(),
            Scores = assessment.Scores
                .OrderBy(score => score.Scope)
                .ThenBy(score => score.Category?.SortOrder)
                .ThenBy(score => score.Module?.SortOrder)
                .ThenBy(score => score.SubModule?.SortOrder)
                .Select(score => new AssessmentScoreDto
                {
                    AssessmentScoreId = score.AssessmentScoreId,
                    AssessmentId = score.AssessmentId,
                    Scope = score.Scope,
                    CategoryId = score.CategoryId,
                    CategoryName = score.Category?.Name,
                    ModuleId = score.ModuleId,
                    ModuleName = score.Module?.Name,
                    SubModuleId = score.SubModuleId,
                    SubModuleName = score.SubModule?.Name,
                    Score = score.Score,
                    AnsweredCount = score.AnsweredCount,
                    QuestionCount = score.QuestionCount,
                    MaturityLevel = score.MaturityLevel,
                    CalculatedAtUtc = score.CalculatedAtUtc
                })
                .ToArray(),
            Recommendations = assessment.Recommendations
                .OrderBy(recommendation => recommendation.Priority)
                .ThenBy(recommendation => recommendation.Title)
                .Select(recommendation => new RecommendationDto
                {
                    RecommendationId = recommendation.RecommendationId,
                    AssessmentId = recommendation.AssessmentId,
                    CategoryId = recommendation.CategoryId,
                    CategoryName = recommendation.Category?.Name,
                    ModuleId = recommendation.ModuleId,
                    ModuleName = recommendation.Module?.Name,
                    Title = recommendation.Title,
                    Description = recommendation.Description,
                    Priority = recommendation.Priority,
                    CreatedAtUtc = recommendation.CreatedAtUtc
                })
                .ToArray()
        };
    }

    private static AssessmentResponseDto MapResponse(AssessmentResponse response)
    {
        return new AssessmentResponseDto
        {
            AssessmentResponseId = response.AssessmentResponseId,
            AssessmentId = response.AssessmentId,
            QuestionId = response.QuestionId,
            Answer = response.Answer,
            Points = response.Points,
            Findings = response.Findings,
            AnsweredAtUtc = response.AnsweredAtUtc
        };
    }

    private sealed record ScoreItem(
        Guid CategoryId,
        string CategoryName,
        Guid ModuleId,
        string ModuleName,
        Guid SubModuleId,
        string SubModuleName,
        bool IsAnswered,
        decimal Points,
        decimal Weight);
}
