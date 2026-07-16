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
        string? category = null,
        CancellationToken cancellationToken = default);

    Task<CreateIdentityAccessResultDto> CreateIdentityAccessAsync(
        Guid createdByUserId,
        CreateIdentityAccessRequestDto request,
        CancellationToken cancellationToken = default);

    Task<CreateIdentityLinkResultDto> CreateIdentityLinkAsync(

        Guid createdByUserId,

        CreateIdentityLinkRequestDto request,

        CancellationToken cancellationToken = default);



    Task<UserAccessRequestDto?> UpdateUserAccessAsync(
        Guid userId,
        Guid modifiedByUserId,
        string? roleCode,
        string? category,
        bool isActive,
        CancellationToken cancellationToken = default);

    Task<bool> DeactivateUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
