using qMRI.Application.Assessments.DTOs;

namespace qMRI.Application.Assessments.Abstractions;

public interface IAssessmentExecutionService
{
    Task<AssessmentSummaryDto> CreateAssessmentAsync(
        CreateAssessmentRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AssessmentSummaryDto>> GetAssessmentsAsync(
        Guid? userId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AssessmentSummaryDto>> GetAssessmentsForAssigneeAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<AssessmentDetailDto?> GetAssessmentAsync(Guid assessmentId, CancellationToken cancellationToken = default);

    Task<Guid?> GetAssessmentOwnerUserIdAsync(Guid assessmentId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ExamTakerProgressDto>> GetExamTakersAsync(
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task<AssessmentSummaryDto?> StartAssessmentAsync(Guid assessmentId, CancellationToken cancellationToken = default);

    Task<AssessmentSummaryDto?> UpdateAssessmentAsync(
        Guid assessmentId,
        UpdateAssessmentRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAssessmentAsync(Guid assessmentId, CancellationToken cancellationToken = default);
    Task<AssessmentResponseDto?> SaveResponseAsync(
        Guid assessmentId,
        UpsertAssessmentResponseRequest request,
        CancellationToken cancellationToken = default);

    Task<AssessmentDetailDto?> SubmitAssessmentAsync(Guid assessmentId, CancellationToken cancellationToken = default);
}
