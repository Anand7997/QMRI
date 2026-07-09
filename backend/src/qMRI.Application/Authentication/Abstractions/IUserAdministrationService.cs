using qMRI.Application.Authentication.DTOs;
using qMRI.Domain.Common.Enums;

namespace qMRI.Application.Authentication.Abstractions;

public interface IUserAdministrationService
{
    Task<IReadOnlyCollection<UserAccessRequestDto>> GetUsersAsync(
        UserApprovalStatus? approvalStatus = null,
        CancellationToken cancellationToken = default);

    Task<UserAccessRequestDto?> ApproveUserAsync(
        Guid userId,
        Guid approvedByUserId,
        string? roleCode = null,
        CancellationToken cancellationToken = default);
}
