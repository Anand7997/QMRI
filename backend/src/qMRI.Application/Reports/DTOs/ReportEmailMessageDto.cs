namespace qMRI.Application.Reports.DTOs;

public sealed class ReportEmailMessageDto
{
    public required string RecipientEmail { get; init; }
    public string? RecipientName { get; init; }
    public required string AssessmentTitle { get; init; }

    public string? AssessmentDescription { get; init; }
    public required string FileName { get; init; }
    public required byte[] PdfContent { get; init; }
}
