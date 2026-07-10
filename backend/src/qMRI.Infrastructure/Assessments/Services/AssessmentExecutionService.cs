using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;
using qMRI.Domain.Assessments.Entities;
using qMRI.Domain.Assessments.Enums;
using qMRI.Domain.Common.Entities;
using qMRI.Domain.Common.Enums;
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

        var scoringModelId = request.ScoringModelId
            ?? (await scoringConfigurationService.EnsureDefaultScoringModelAsync(cancellationToken)).ScoringModelId;

        var scoringModelExists = await dbContext.ScoringModels
            .AnyAsync(model => model.ScoringModelId == scoringModelId && model.IsActive, cancellationToken);

        if (!scoringModelExists)
        {
            throw new ArgumentException("The requested scoring model does not exist or is inactive.");
        }

        var assignees = await ResolveAssigneesAsync(request, selectedDepartments, cancellationToken);

        if (assignees.Length == 0)
        {
            throw new ArgumentException("No active approved users are available in the selected departments.");
        }

        var assignedBy = await ResolveAssigningUserAsync(request, assignees, cancellationToken);

        if (assignedBy is null)
        {
            throw new ArgumentException("The assigning user could not be resolved.");
        }

        var now = DateTime.UtcNow;
        var serializedDepartments = SerializeStringList(selectedDepartments);
        var serializedQuestionIds = SerializeGuidList(validQuestionIds);
        var title = string.IsNullOrWhiteSpace(request.Title) ? "qMRI TOPP Assessment" : request.Title.Trim();
        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        var assessments = new List<Assessment>(assignees.Length);
        var userRecords = new List<UserRecord>(assignees.Length);
        var adminRecords = new List<AdminRecord>(assignees.Length);

        foreach (var assignee in assignees)
        {
            var assessmentId = Guid.NewGuid();

            assessments.Add(new Assessment
            {
                AssessmentId = assessmentId,
                UserId = assignee.UserId,
                ScoringModelId = scoringModelId,
                Title = title,
                Description = description,
                Departments = serializedDepartments,
                SelectedQuestionIds = serializedQuestionIds,
                Status = AssessmentStatus.Draft,
                StartedAtUtc = null,
                CreatedAtUtc = now
            });

            userRecords.Add(new UserRecord
            {
                UserRecordId = Guid.NewGuid(),
                AssessmentId = assessmentId,
                UserId = assignee.UserId,
                UserName = assignee.UserName,
                FullName = string.IsNullOrWhiteSpace(assignee.FullName) ? assignee.UserName : assignee.FullName,
                CreatedAtUtc = now,
                RecordDateUtc = now.Date
            });

            adminRecords.Add(new AdminRecord
            {
                AdminRecordId = Guid.NewGuid(),
                AssessmentId = assessmentId,
                AssignedByUserId = assignedBy.UserId,
                AssignedByUserName = assignedBy.UserName,
                AssignedByFullName = string.IsNullOrWhiteSpace(assignedBy.FullName) ? assignedBy.UserName : assignedBy.FullName,
                AssignedToUserId = assignee.UserId,
                AssignedToUserName = assignee.UserName,
                AssignedToFullName = string.IsNullOrWhiteSpace(assignee.FullName) ? assignee.UserName : assignee.FullName,
                AssignedDepartments = serializedDepartments,
                AssignedQuestionIds = serializedQuestionIds,
                AssignedAtUtc = now
            });
        }

        dbContext.Assessments.AddRange(assessments);
        dbContext.UserRecords.AddRange(userRecords);
        dbContext.AdminRecords.AddRange(adminRecords);
        await dbContext.SaveChangesAsync(cancellationToken);

        var questionCount = validQuestionIds.Length;
        var assignedByMetadata = new AssessmentAssignedByMetadata(
            assignedBy.UserId,
            assignedBy.UserName,
            string.IsNullOrWhiteSpace(assignedBy.FullName) ? assignedBy.UserName : assignedBy.FullName);

        return MapSummary(assessments[0], questionCount, assignedByMetadata);
    }

    private async Task<User[]> ResolveAssigneesAsync(
        CreateAssessmentRequest request,
        IReadOnlyCollection<string> selectedDepartments,
        CancellationToken cancellationToken)
    {
        if (request.UserId.HasValue)
        {
            var assignee = await dbContext.Users
                .AsNoTracking()
                .SingleOrDefaultAsync(user => user.UserId == request.UserId.Value, cancellationToken);

            if (assignee is null)
            {
                throw new ArgumentException("The requested assessment user does not exist.");
            }

            return [assignee];
        }

        var normalizedDepartments = selectedDepartments
            .Select(NormalizeDepartment)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var candidateUsers = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.IsActive && user.ApprovalStatus == UserApprovalStatus.Approved)
            .ToArrayAsync(cancellationToken);

        return candidateUsers
            .Where(user => normalizedDepartments.Contains(NormalizeDepartment(user.Category)))
            .ToArray();
    }

    private async Task<User?> ResolveAssigningUserAsync(
        CreateAssessmentRequest request,
        IReadOnlyList<User> assignees,
        CancellationToken cancellationToken)
    {
        if (request.AssignedByUserId.HasValue)
        {
            return await dbContext.Users
                .AsNoTracking()
                .SingleOrDefaultAsync(user => user.UserId == request.AssignedByUserId.Value, cancellationToken);
        }

        if (request.UserId.HasValue)
        {
            return assignees.FirstOrDefault();
        }

        return null;
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

    public async Task<IReadOnlyList<AssessmentSummaryDto>> GetAssessmentsForAssigneeAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var assessments = await dbContext.Assessments
            .Include(assessment => assessment.Responses)
            .Include(assessment => assessment.Scores)
            .Where(assessment => assessment.UserId == userId)
            .AsNoTracking()
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
        var assignedByMetadata = await GetAssessmentAssignedByMetadataAsync(assessment.AssessmentId, cancellationToken);
        return MapDetail(assessment, questionCount, assignedByMetadata);
    }

    public async Task<Guid?> GetAssessmentOwnerUserIdAsync(Guid assessmentId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Assessments
            .AsNoTracking()
            .Where(entity => entity.AssessmentId == assessmentId)
            .Select(entity => (Guid?)entity.UserId)
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ExamTakerProgressDto>> GetExamTakersAsync(
        Guid assessmentId,
        CancellationToken cancellationToken = default)
    {
        var seedAssessment = await dbContext.Assessments
            .AsNoTracking()
            .SingleOrDefaultAsync(entity => entity.AssessmentId == assessmentId, cancellationToken);

        if (seedAssessment is null)
        {
            return Array.Empty<ExamTakerProgressDto>();
        }

        var assessments = await GetAssignmentCohortQuery(seedAssessment)
            .Include(entity => entity.Responses)
            .AsNoTracking()
            .ToArrayAsync(cancellationToken);

        if (assessments.Length == 0)
        {
            return Array.Empty<ExamTakerProgressDto>();
        }

        var userIds = assessments
            .Select(entity => entity.UserId)
            .Distinct()
            .ToArray();

        var usersById = await dbContext.Users
            .AsNoTracking()
            .Where(user => userIds.Contains(user.UserId))
            .ToDictionaryAsync(user => user.UserId, cancellationToken);

        var questionCount = await CountAssessmentQuestionsAsync(seedAssessment, cancellationToken);
        var selectedQuestionIds = GetSelectedQuestionIds(seedAssessment);

        return assessments
            .Select(entity =>
            {
                usersById.TryGetValue(entity.UserId, out var user);

                var answeredCount = entity.Responses
                    .Where(response => selectedQuestionIds.Count == 0 || selectedQuestionIds.Contains(response.QuestionId))
                    .Select(response => response.QuestionId)
                    .Distinct()
                    .Count();

                return new ExamTakerProgressDto
                {
                    AssessmentId = entity.AssessmentId,
                    UserId = entity.UserId,
                    UserName = user?.UserName ?? string.Empty,
                    FullName = string.IsNullOrWhiteSpace(user?.FullName) ? user?.UserName ?? string.Empty : user!.FullName,
                    Department = user?.Category ?? string.Empty,
                    ProgressStatus = ResolveExamTakerStatus(entity.Status),
                    AnsweredCount = answeredCount,
                    QuestionCount = questionCount,
                    CompletionPercentage = questionCount == 0
                        ? 0
                        : Math.Round(answeredCount * 100m / questionCount, 2, MidpointRounding.AwayFromZero),
                    StartedAtUtc = entity.StartedAtUtc,
                    FinishedAtUtc = entity.ScoredAtUtc ?? entity.SubmittedAtUtc
                };
            })
            .OrderBy(item => ResolveExamTakerStatusOrder(item.ProgressStatus))
            .ThenBy(item => item.FullName)
            .ToArray();
    }

    public async Task<AssessmentSummaryDto?> StartAssessmentAsync(Guid assessmentId, CancellationToken cancellationToken = default)
    {
        var assessment = await dbContext.Assessments
            .Include(entity => entity.Responses)
            .Include(entity => entity.Scores)
            .SingleOrDefaultAsync(entity => entity.AssessmentId == assessmentId, cancellationToken);

        if (assessment is null)
        {
            return null;
        }

        if (assessment.Status == AssessmentStatus.Archived)
        {
            throw new InvalidOperationException("Archived assessments cannot be started.");
        }

        if (assessment.Status == AssessmentStatus.Draft)
        {
            var startedAtUtc = DateTime.UtcNow;
            assessment.Status = AssessmentStatus.InProgress;
            assessment.StartedAtUtc ??= startedAtUtc;
            await EnsureUserRecordAsync(assessment, startedAtUtc: assessment.StartedAtUtc, cancellationToken: cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var questionCount = await CountAssessmentQuestionsAsync(assessment, cancellationToken);
        var assignedByMetadata = await GetAssessmentAssignedByMetadataAsync(assessment.AssessmentId, cancellationToken);
        return MapSummary(assessment, questionCount, assignedByMetadata);
    }

    public async Task<AssessmentSummaryDto?> UpdateAssessmentAsync(
        Guid assessmentId,
        UpdateAssessmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var assessment = await dbContext.Assessments
            .SingleOrDefaultAsync(entity => entity.AssessmentId == assessmentId, cancellationToken);

        if (assessment is null)
        {
            return null;
        }

        var updatedTitle = string.IsNullOrWhiteSpace(request.Title)
            ? "qMRI TOPP Assessment"
            : request.Title.Trim();
        var updatedDescription = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();

        var cohort = await GetAssignmentCohortQuery(assessment)
            .ToArrayAsync(cancellationToken);

        foreach (var item in cohort)
        {
            item.Title = updatedTitle;
            item.Description = updatedDescription;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var updatedAssessment = await dbContext.Assessments
            .Include(entity => entity.Responses)
            .Include(entity => entity.Scores)
            .SingleAsync(entity => entity.AssessmentId == assessmentId, cancellationToken);

        var questionCount = await CountAssessmentQuestionsAsync(updatedAssessment, cancellationToken);
        var assignedByMetadata = await GetAssessmentAssignedByMetadataAsync(updatedAssessment.AssessmentId, cancellationToken);
        return MapSummary(updatedAssessment, questionCount, assignedByMetadata);
    }

    public async Task<bool> DeleteAssessmentAsync(Guid assessmentId, CancellationToken cancellationToken = default)
    {
        var assessment = await dbContext.Assessments
            .SingleOrDefaultAsync(entity => entity.AssessmentId == assessmentId, cancellationToken);

        if (assessment is null)
        {
            return false;
        }

        var cohort = await GetAssignmentCohortQuery(assessment)
            .ToArrayAsync(cancellationToken);

        if (cohort.Length == 0)
        {
            dbContext.Assessments.Remove(assessment);
        }
        else
        {
            dbContext.Assessments.RemoveRange(cohort);
        }

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
        await EnsureUserRecordAsync(assessment, startedAtUtc: assessment.StartedAtUtc, cancellationToken: cancellationToken);

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

        await EnsureUserRecordAsync(assessment, startedAtUtc: assessment.StartedAtUtc, endedAtUtc: now, cancellationToken: cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAssessmentAsync(assessmentId, cancellationToken);
    }

    private async Task EnsureUserRecordAsync(
        Assessment assessment,
        DateTime? startedAtUtc = null,
        DateTime? endedAtUtc = null,
        CancellationToken cancellationToken = default)
    {
        var userRecord = await dbContext.UserRecords
            .SingleOrDefaultAsync(entity => entity.AssessmentId == assessment.AssessmentId, cancellationToken);

        if (userRecord is null)
        {
            var user = await dbContext.Users
                .AsNoTracking()
                .SingleOrDefaultAsync(entity => entity.UserId == assessment.UserId, cancellationToken);

            if (user is null)
            {
                return;
            }

            userRecord = new UserRecord
            {
                UserRecordId = Guid.NewGuid(),
                AssessmentId = assessment.AssessmentId,
                UserId = user.UserId,
                UserName = user.UserName,
                FullName = string.IsNullOrWhiteSpace(user.FullName) ? user.UserName : user.FullName,
                CreatedAtUtc = assessment.CreatedAtUtc,
                RecordDateUtc = assessment.CreatedAtUtc.Date
            };

            dbContext.UserRecords.Add(userRecord);
        }

        if (startedAtUtc.HasValue)
        {
            userRecord.StartedAtUtc ??= startedAtUtc.Value;
            userRecord.RecordDateUtc = startedAtUtc.Value.Date;
        }

        if (endedAtUtc.HasValue)
        {
            userRecord.EndedAtUtc = endedAtUtc.Value;
            userRecord.RecordDateUtc = endedAtUtc.Value.Date;
        }
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

    private IQueryable<Assessment> GetAssignmentCohortQuery(Assessment seedAssessment)
    {
        return dbContext.Assessments.Where(entity =>
            entity.CreatedAtUtc == seedAssessment.CreatedAtUtc &&
            entity.Title == seedAssessment.Title &&
            entity.Description == seedAssessment.Description &&
            entity.Departments == seedAssessment.Departments &&
            entity.SelectedQuestionIds == seedAssessment.SelectedQuestionIds &&
            entity.ScoringModelId == seedAssessment.ScoringModelId);
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
        if (assessments.Count == 0)
        {
            return Array.Empty<AssessmentSummaryDto>();
        }

        var assignedByMetadataByAssessmentId = await GetAssessmentAssignedByMetadataMapAsync(
            assessments.Select(assessment => assessment.AssessmentId).ToArray(),
            cancellationToken);

        var summaries = new List<AssessmentSummaryDto>(assessments.Count);
        foreach (var assessment in assessments)
        {
            assignedByMetadataByAssessmentId.TryGetValue(assessment.AssessmentId, out var assignedByMetadata);
            summaries.Add(MapSummary(
                assessment,
                await CountAssessmentQuestionsAsync(assessment, cancellationToken),
                assignedByMetadata));
        }

        return summaries.ToArray();
    }

    private async Task<AssessmentAssignedByMetadata?> GetAssessmentAssignedByMetadataAsync(
        Guid assessmentId,
        CancellationToken cancellationToken)
    {
        var metadataByAssessmentId = await GetAssessmentAssignedByMetadataMapAsync([assessmentId], cancellationToken);
        return metadataByAssessmentId.GetValueOrDefault(assessmentId);
    }

    private async Task<Dictionary<Guid, AssessmentAssignedByMetadata>> GetAssessmentAssignedByMetadataMapAsync(
        IReadOnlyCollection<Guid> assessmentIds,
        CancellationToken cancellationToken)
    {
        if (assessmentIds.Count == 0)
        {
            return [];
        }

        var records = await dbContext.AdminRecords
            .AsNoTracking()
            .Where(record => assessmentIds.Contains(record.AssessmentId))
            .OrderByDescending(record => record.AssignedAtUtc)
            .ToArrayAsync(cancellationToken);

        return records
            .GroupBy(record => record.AssessmentId)
            .ToDictionary(
                group => group.Key,
                group =>
                {
                    var record = group.First();
                    return new AssessmentAssignedByMetadata(
                        record.AssignedByUserId,
                        record.AssignedByUserName,
                        record.AssignedByFullName);
                });
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

    private static bool IsAssignedToDepartment(Assessment assessment, string userDepartment)
    {
        if (string.IsNullOrWhiteSpace(userDepartment))
        {
            return false;
        }

        return GetDepartments(assessment)
            .Select(NormalizeDepartment)
            .Any(department => string.Equals(department, userDepartment, StringComparison.OrdinalIgnoreCase));
    }

    private static string[] NormalizeDepartments(IEnumerable<string> departments)
    {
        return departments
            .Where(department => !string.IsNullOrWhiteSpace(department))
            .Select(department => department.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static string NormalizeDepartment(string? department) => department?.Trim() ?? string.Empty;

    private static string ResolveExamTakerStatus(AssessmentStatus status)
    {
        return status switch
        {
            AssessmentStatus.Draft => "NotStarted",
            AssessmentStatus.InProgress => "InProgress",
            AssessmentStatus.Submitted => "Finished",
            AssessmentStatus.Scored => "Finished",
            AssessmentStatus.Archived => "Finished",
            _ => "NotStarted"
        };
    }

    private static int ResolveExamTakerStatusOrder(string status)
    {
        return status switch
        {
            "InProgress" => 0,
            "NotStarted" => 1,
            "Finished" => 2,
            _ => 3
        };
    }

    private static string SerializeGuidList(IEnumerable<Guid> values) => JsonSerializer.Serialize(values.Distinct().ToArray());

    private static string SerializeStringList(IEnumerable<string> values) => JsonSerializer.Serialize(NormalizeDepartments(values));

    private static AssessmentSummaryDto MapSummary(
        Assessment assessment,
        int questionCount,
        AssessmentAssignedByMetadata? assignedByMetadata = null)
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
            AssignedByUserId = assignedByMetadata?.AssignedByUserId,
            AssignedByUserName = assignedByMetadata?.AssignedByUserName,
            AssignedByFullName = assignedByMetadata?.AssignedByFullName,
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

    private static AssessmentDetailDto MapDetail(
        Assessment assessment,
        int questionCount,
        AssessmentAssignedByMetadata? assignedByMetadata = null)
    {
        return new AssessmentDetailDto
        {
            Summary = MapSummary(assessment, questionCount, assignedByMetadata),
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

    private sealed record AssessmentAssignedByMetadata(
        Guid AssignedByUserId,
        string AssignedByUserName,
        string AssignedByFullName);
}
