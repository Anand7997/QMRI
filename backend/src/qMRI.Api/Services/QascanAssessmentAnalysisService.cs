using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Assessments.DTOs;
using qMRI.Domain.Assessments.Enums;

namespace qMRI.Api.Services;

public sealed class QascanAssessmentAnalysisService(IMemoryCache cache) : IQmriAgentAnalysisService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly IReadOnlyDictionary<string, QuestionFeedback> FeedbackByQuestion = LoadFeedback();

    public Task<QmriAgentAnalysisDto> AnalyzeAsync(
        AssessmentDetailDto assessment,
        string safetyIdentifier,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"qascan-deterministic-analysis:v1:{assessment.Summary.AssessmentId}:{assessment.Summary.ScoredAtUtc?.Ticks ?? 0}";
        if (cache.TryGetValue(cacheKey, out QmriAgentAnalysisDto? cached) && cached is not null)
        {
            return Task.FromResult(cached);
        }

        var result = BuildAnalysis(assessment);
        cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
        return Task.FromResult(result);
    }

    private static QmriAgentAnalysisDto BuildAnalysis(AssessmentDetailDto assessment)
    {
        var answered = assessment.QuestionResults.Where(result => result.Answer.HasValue).ToArray();
        var reviewed = answered.Select(result => (Result: result, Feedback: FindFeedback(result))).ToArray();
        var categoryScores = assessment.Scores
            .Where(score => score.Scope == ScoreScope.Category && !string.IsNullOrWhiteSpace(score.CategoryName))
            .OrderByDescending(score => score.Score)
            .ToArray();
        var topCategory = categoryScores.FirstOrDefault();
        var bottomCategory = categoryScores.LastOrDefault();

        var strengths = reviewed
            .Where(item => item.Result.Answer == item.Result.ExpectedAnswer && item.Feedback is not null)
            .Select(item => ToInsight(item.Result, item.Feedback!))
            .Take(5)
            .ToList();
        var gaps = reviewed
            .Where(item => item.Result.Answer != item.Result.ExpectedAnswer && item.Feedback is not null)
            .Select(item => ToInsight(item.Result, item.Feedback!))
            .Take(5)
            .ToList();
        var actions = reviewed
            .Where(item => item.Feedback is not null)
            .SelectMany(item => item.Feedback!.Recommendations.Select(recommendation => new QmriAgentInsightDto
            {
                Title = recommendation,
                Summary = item.Feedback.Diagnosis,
                Evidence = BuildEvidence(item.Result)
            }))
            .Take(5)
            .ToList();

        AddDefaults(assessment, answered.Length, strengths, gaps, actions);

        return new QmriAgentAnalysisDto
        {
            AgentMessage = $"Average is {FormatScore(assessment.Summary.OverallScore ?? 0m)} overall across {answered.Length} answered responses. " +
                $"{topCategory?.CategoryName ?? "The strongest assessed area"} is the clearest strength in the scanned data, while " +
                $"{bottomCategory?.CategoryName ?? "the areas identified above"} should guide the next improvement cycle. " +
                "The guidance below is selected from the approved QAScan question feedback catalog.",
            StrongestSignal = topCategory is null
                ? $"{answered.Length} answered responses were available for review."
                : $"{topCategory.CategoryName} is currently the strongest category at {FormatScore(topCategory.Score)}.",
            NextStep = bottomCategory is null
                ? "Review the detailed report and confirm the first remediation target."
                : $"Prioritise a focused remediation plan for {bottomCategory.CategoryName}.",
            Strengths = strengths,
            PriorityGaps = gaps,
            RecommendedActions = actions,
            AnalysedResponseCount = answered.Length,
            GeneratedAtUtc = DateTime.UtcNow
        };
    }

    private static void AddDefaults(
        AssessmentDetailDto assessment,
        int answeredCount,
        List<QmriAgentInsightDto> strengths,
        List<QmriAgentInsightDto> gaps,
        List<QmriAgentInsightDto> actions)
    {
        if (strengths.Count == 0)
        {
            strengths.Add(new QmriAgentInsightDto
            {
                Title = "Assessment coverage is available",
                Summary = $"The assessment includes {answeredCount} answered responses that are ready for deterministic review.",
                Evidence = $"Answered responses: {answeredCount}. Overall score: {FormatScore(assessment.Summary.OverallScore ?? 0m)}"
            });
        }

        if (gaps.Count == 0)
        {
            gaps.Add(new QmriAgentInsightDto
            {
                Title = "No scored response gap was identified",
                Summary = "The submitted answers match the expected answer for the reviewed questions. Continue monitoring the detailed report for changes.",
                Evidence = $"Reviewed responses: {answeredCount}."
            });
        }

        if (actions.Count == 0)
        {
            actions.Add(new QmriAgentInsightDto
            {
                Title = "Review the detailed report",
                Summary = "Use the detailed question results to confirm ownership, timing, and follow-up actions.",
                Evidence = $"Overall score: {FormatScore(assessment.Summary.OverallScore ?? 0m)}"
            });
        }
    }

    private static QuestionOutcome? FindFeedback(AssessmentQuestionResultDto result) =>
        FeedbackByQuestion.TryGetValue(Normalize(result.QuestionText), out var feedback)
            ? feedback.For(result.Answer!.Value)
            : null;

    private static QmriAgentInsightDto ToInsight(AssessmentQuestionResultDto result, QuestionOutcome feedback) =>
        new()
        {
            Title = feedback.Title,
            Summary = feedback.Diagnosis + (string.IsNullOrWhiteSpace(feedback.Problem) ? string.Empty : $" {feedback.Problem}"),
            Evidence = BuildEvidence(result)
        };

    private static string BuildEvidence(AssessmentQuestionResultDto result) =>
        $"Question: {result.QuestionText} Answer: {result.Answer}. Category: {result.CategoryName}. Module: {result.ModuleName}.";

    private static IReadOnlyDictionary<string, QuestionFeedback> LoadFeedback()
    {
        var resourceName = typeof(QascanAssessmentAnalysisService).Assembly
            .GetManifestResourceNames()
            .Single(name => name.EndsWith("qascan-question-feedback.json", StringComparison.Ordinal));
        using var stream = typeof(QascanAssessmentAnalysisService).Assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException("The QAScan feedback catalog is not embedded.");
        var entries = JsonSerializer.Deserialize<List<QuestionFeedback>>(stream, JsonOptions)
            ?? throw new InvalidOperationException("The QAScan feedback catalog is empty.");
        return entries.ToDictionary(entry => Normalize(entry.Question), StringComparer.Ordinal);
    }

    private static string Normalize(string value) =>
        string.Join(' ', value.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    private static string FormatScore(decimal score) => $"{decimal.Round(score, 1):0.#} percent";

    private sealed class QuestionFeedback
    {
        public string Question { get; set; } = string.Empty;
        public QuestionOutcome Yes { get; set; } = new();
        public QuestionOutcome No { get; set; } = new();
        public QuestionOutcome Partial { get; set; } = new();

        public QuestionOutcome For(AnswerOption answer) => answer switch
        {
            AnswerOption.Yes => Yes,
            AnswerOption.No => No,
            _ => Partial
        };
    }

    private sealed class QuestionOutcome
    {
        public string Title { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
        public string? Problem { get; set; }
        public IReadOnlyList<string> Recommendations { get; set; } = Array.Empty<string>();
    }
}
