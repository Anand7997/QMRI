using qMRI.Application.Assessments.DTOs;

namespace qMRI.Application.Assessments.Abstractions;

public interface IScoringConfigurationService
{
    Task<IReadOnlyList<ScoringModelDto>> GetScoringModelsAsync(CancellationToken cancellationToken = default);

    Task<ScoringModelDto?> GetScoringModelAsync(Guid scoringModelId, CancellationToken cancellationToken = default);

    Task<ScoringModelDto> CreateScoringModelAsync(
        UpsertScoringModelRequest request,
        CancellationToken cancellationToken = default);

    Task<ScoringModelDto?> UpdateScoringModelAsync(
        Guid scoringModelId,
        UpsertScoringModelRequest request,
        CancellationToken cancellationToken = default);

    Task<ScoringModelDto> EnsureDefaultScoringModelAsync(CancellationToken cancellationToken = default);

    Task<bool> SetDefaultScoringModelAsync(Guid scoringModelId, CancellationToken cancellationToken = default);
}
