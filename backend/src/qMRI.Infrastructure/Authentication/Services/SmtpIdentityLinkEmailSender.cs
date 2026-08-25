using System.Globalization;
using System.Net;
using System.Net.Mail;
using System.Text.Encodings.Web;
using Microsoft.Extensions.Options;
using qMRI.Application.Authentication.Abstractions;
using qMRI.Application.Authentication.DTOs;
using qMRI.Infrastructure.Authentication.Options;

namespace qMRI.Infrastructure.Authentication.Services;

public sealed class SmtpIdentityLinkEmailSender(
    IOptions<IdentityLinkEmailOptions> options) : IIdentityLinkEmailSender
{
    public async Task SendAsync(
        IdentityLinkEmailMessageDto message,
        CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        ValidateSettings(settings);

        using var mailMessage = new MailMessage
        {
            From = CreateAddress(settings.FromAddress, settings.FromName, "Email sender address"),
            Subject = "Your qMRI assessment access link",
            Body = BuildBody(message),
            IsBodyHtml = true
        };
        mailMessage.To.Add(CreateAddress(message.RecipientEmail, message.RecipientName, "Recipient email address"));

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
            throw new InvalidOperationException("Unable to send email through the configured SMTP server.", exception);
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

    private static string BuildBody(IdentityLinkEmailMessageDto message)
    {
        var recipientName = Html(message.RecipientName);
        var recipientEmail = Html(message.RecipientEmail);
        var link = Html(message.Link);
        var requestedAt = Html(FormatUtc(message.RequestedAtUtc));
        var approvedAt = Html(FormatUtc(message.ApprovedAtUtc));
        var expiresAt = Html(FormatUtc(message.IdentityLinkExpiresAtUtc));
        var assessmentSection = BuildAssessmentSection(message.Assessments);

        return $"""
            <!doctype html>
            <html>
            <body style="font-family: Arial, sans-serif; color: #172033; line-height: 1.5;">
              <p>Hello {recipientName},</p>
              <p>Your qMRI assessment access has been approved. Use the link below to open My Assessments and begin or continue your assigned TOPP QA maturity assessment.</p>
              <p>
                <a href="{link}" style="display: inline-block; background: #0f766e; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-weight: 700;">
                  Open assessment
                </a>
              </p>
              <table style="border-collapse: collapse; margin-top: 16px;">
                <tbody>
                  <tr><td style="padding: 6px 12px; color: #5f6b7a;">Recipient</td><td style="padding: 6px 12px;">{recipientName}</td></tr>
                  <tr><td style="padding: 6px 12px; color: #5f6b7a;">Email</td><td style="padding: 6px 12px;">{recipientEmail}</td></tr>
                  <tr><td style="padding: 6px 12px; color: #5f6b7a;">Role</td><td style="padding: 6px 12px;">{Html(message.RoleCode)}</td></tr>
                  <tr><td style="padding: 6px 12px; color: #5f6b7a;">Category</td><td style="padding: 6px 12px;">{Html(message.Category)}</td></tr>
                  <tr><td style="padding: 6px 12px; color: #5f6b7a;">Status</td><td style="padding: 6px 12px;">{Html(message.ApprovalStatus)}</td></tr>
                  <tr><td style="padding: 6px 12px; color: #5f6b7a;">Requested</td><td style="padding: 6px 12px;">{requestedAt}</td></tr>
                  <tr><td style="padding: 6px 12px; color: #5f6b7a;">Approved</td><td style="padding: 6px 12px;">{approvedAt}</td></tr>
                  <tr><td style="padding: 6px 12px; color: #5f6b7a;">Link expires</td><td style="padding: 6px 12px;">{expiresAt}</td></tr>
                </tbody>
              </table>
              {assessmentSection}
              <p>If the button does not work, copy and paste this URL into your browser:</p>
              <p style="word-break: break-all;">{link}</p>
            </body>
            </html>
            """;
    }

    private static string FormatUtc(DateTime? value)
    {
        return value.HasValue
            ? value.Value.ToUniversalTime().ToString("yyyy-MM-dd HH:mm 'UTC'", CultureInfo.InvariantCulture)
            : "--";
    }

    private static string Html(string? value) => HtmlEncoder.Default.Encode(value ?? string.Empty);

    private static string BuildAssessmentSection(IReadOnlyList<IdentityLinkAssessmentEmailDetailDto> assessments)
    {
        if (assessments.Count == 0)
        {
            return """
              <h3 style="margin-top: 20px;">Assigned assessment details</h3>
              <p>No active assigned assessment is currently listed for this account. The link will open My Assessments when an assessment is assigned.</p>
              """;
        }

        var rows = string.Join(
            string.Empty,
            assessments.Select(assessment =>
            {
                var description = string.IsNullOrWhiteSpace(assessment.Description)
                    ? string.Empty
                    : $"""<div style="color: #5f6b7a; margin-top: 4px;">{Html(assessment.Description)}</div>""";

                return $"""
                  <tr>
                    <td style="padding: 8px 12px; border-top: 1px solid #dbe3ea;">
                      <strong>{Html(assessment.Title)}</strong>
                      <div style="color: #5f6b7a; font-size: 12px;">{Html(assessment.AssessmentId.ToString())}</div>
                      {description}
                    </td>
                    <td style="padding: 8px 12px; border-top: 1px solid #dbe3ea;">{Html(assessment.Status)}</td>
                    <td style="padding: 8px 12px; border-top: 1px solid #dbe3ea;">{Html(assessment.Departments)}</td>
                    <td style="padding: 8px 12px; border-top: 1px solid #dbe3ea;">{assessment.QuestionCount}</td>
                    <td style="padding: 8px 12px; border-top: 1px solid #dbe3ea;">{Html(FormatUtc(assessment.CreatedAtUtc))}</td>
                  </tr>
                  """;
            }));

        return $"""
              <h3 style="margin-top: 20px;">Assigned assessment details</h3>
              <table style="border-collapse: collapse; width: 100%; margin-top: 8px;">
                <thead>
                  <tr>
                    <th align="left" style="padding: 8px 12px;">Assessment</th>
                    <th align="left" style="padding: 8px 12px;">Status</th>
                    <th align="left" style="padding: 8px 12px;">Departments</th>
                    <th align="left" style="padding: 8px 12px;">Questions</th>
                    <th align="left" style="padding: 8px 12px;">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {rows}
                </tbody>
              </table>
              """;
    }

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
