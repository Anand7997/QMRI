using qMRI.Application.Assessments.DTOs;

namespace qMRI.Application.Assessments.Abstractions;

public interface IAssessmentSeedService
{
    Task<SeedAssessmentResultDto> SeedToppAssessmentAsync(
        SeedAssessmentRequest request,
        CancellationToken cancellationToken = default);
}
