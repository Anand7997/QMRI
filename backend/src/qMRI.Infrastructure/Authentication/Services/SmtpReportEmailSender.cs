using System.Net;
using System.Net.Mail;
using System.Text.Encodings.Web;
using Microsoft.Extensions.Options;
using qMRI.Application.Reports.Abstractions;
using qMRI.Application.Reports.DTOs;
using qMRI.Infrastructure.Authentication.Options;

namespace qMRI.Infrastructure.Authentication.Services;

public sealed class SmtpReportEmailSender(IOptions<IdentityLinkEmailOptions> options) : IReportEmailSender
{
    public async Task SendAsync(ReportEmailMessageDto message, CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        ValidateSettings(settings);

        using var attachmentStream = new MemoryStream(message.PdfContent, writable: false);
        using var mailMessage = new MailMessage
        {
            From = CreateAddress(settings.FromAddress, settings.FromName, "Email sender address"),
            Subject = $"Your QAScan report - {message.AssessmentTitle}",
            Body = BuildBody(message),
            IsBodyHtml = true
        };
        mailMessage.To.Add(CreateAddress(message.RecipientEmail, message.RecipientName, "Recipient email address"));
        mailMessage.Attachments.Add(new Attachment(attachmentStream, message.FileName, "application/pdf"));

        using var smtpClient = new SmtpClient(settings.Host.Trim(), settings.Port)
        {
            EnableSsl = settings.UseSsl,
            Timeout = Math.Clamp(settings.TimeoutSeconds, 1, 300) * 1000,
            UseDefaultCredentials = false
        };

        if (!string.IsNullOrWhiteSpace(settings.UserName))
        {
            smtpClient.Credentials = new NetworkCredential(settings.UserName.Trim(), settings.Password);
        }

        try
        {
            await smtpClient.SendMailAsync(mailMessage, cancellationToken);
        }
        catch (SmtpException exception)
        {
            throw new InvalidOperationException("Unable to send the report through the configured SMTP server.", exception);
        }
    }

    private static void ValidateSettings(IdentityLinkEmailOptions settings)
    {
        if (!settings.Enabled)
        {
            throw new InvalidOperationException("Email delivery is not configured. Set Email:Enabled to true and provide SMTP settings.");
        }

        if (string.IsNullOrWhiteSpace(settings.Host))
        {
            throw new InvalidOperationException("Email SMTP host is not configured.");
        }

        if (settings.Port <= 0)
        {
            throw new InvalidOperationException("Email SMTP port is not configured.");
        }

        if (string.IsNullOrWhiteSpace(settings.FromAddress))
        {
            throw new InvalidOperationException("Email sender address is not configured.");
        }
    }

    private static string BuildBody(ReportEmailMessageDto message)
    {
        var recipientName = Html(string.IsNullOrWhiteSpace(message.RecipientName) ? "there" : message.RecipientName);
        var title = Html(message.AssessmentTitle);
        var description = string.IsNullOrWhiteSpace(message.AssessmentDescription)
            ? "No additional assessment description was provided."
            : Html(message.AssessmentDescription.Trim());

        return $"""
            <!doctype html>
            <html>
            <body style="font-family: Arial, sans-serif; color: #172033; line-height: 1.5;">
              <p>Hello {recipientName},</p>
              <p>Thank you for completing your qMRI assessment. Your detailed assessment report is attached to this email as a PDF for your review and records.</p>
              <p><strong>Assessment:</strong> {title}</p>
              <p><strong>Description:</strong> {description}</p>
              <p>The report contains the assessment summary, maturity scores, recommendations, and detailed response evidence. Please review the findings with your team and use the recommendations to plan your next actions.</p>
              <p>If you have questions about the assessment or its results, please contact your qMRI administrator.</p>
              <p>Regards,<br />qMRI Team</p>
            </body>
            </html>
            """;
    }

    private static string Html(string value) => HtmlEncoder.Default.Encode(value);

    private static MailAddress CreateAddress(string address, string? displayName, string fieldName)
    {
        try
        {
            return new MailAddress(address.Trim(), displayName?.Trim());
        }
        catch (FormatException exception)
        {
            throw new InvalidOperationException($"{fieldName} is not valid.", exception);
        }
    }
}
