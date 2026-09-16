using qMRI.Application.Reports.DTOs;

namespace qMRI.Application.Reports.Abstractions;

public interface IReportEmailSender
{
    Task SendAsync(ReportEmailMessageDto message, CancellationToken cancellationToken = default);
}
