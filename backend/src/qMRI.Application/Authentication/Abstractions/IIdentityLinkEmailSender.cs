using qMRI.Application.Authentication.DTOs;

namespace qMRI.Application.Authentication.Abstractions;

public interface IIdentityLinkEmailSender
{
    Task SendAsync(
        IdentityLinkEmailMessageDto message,
        CancellationToken cancellationToken = default);
}
