using qMRI.Application.Assessments.DTOs;

namespace qMRI.Application.Assessments.Abstractions;

public interface IQmriAgentAnalysisService
{
    Task<QmriAgentAnalysisDto> AnalyzeAsync(
        AssessmentDetailDto assessment,
        string safetyIdentifier,
        CancellationToken cancellationToken = default);
}

public sealed class QmriAgentAnalysisUnavailableException : Exception
{
    public QmriAgentAnalysisUnavailableException(string message)
        : base(message)
    {
    }

    public QmriAgentAnalysisUnavailableException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
