namespace qMRI.Application.Assessments.DTOs;

public sealed class QmriAgentAnalysisDto
{
    public string AgentMessage { get; set; } = string.Empty;
    public string StrongestSignal { get; set; } = string.Empty;
    public string NextStep { get; set; } = string.Empty;
    public IReadOnlyList<QmriAgentInsightDto> Strengths { get; set; } = Array.Empty<QmriAgentInsightDto>();
    public IReadOnlyList<QmriAgentInsightDto> PriorityGaps { get; set; } = Array.Empty<QmriAgentInsightDto>();
    public IReadOnlyList<QmriAgentInsightDto> RecommendedActions { get; set; } = Array.Empty<QmriAgentInsightDto>();
    public int AnalysedResponseCount { get; set; }
    public DateTime GeneratedAtUtc { get; set; }
}

public sealed class QmriAgentInsightDto
{
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Evidence { get; set; } = string.Empty;
}
