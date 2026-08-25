namespace qMRI.Application.Authentication.DTOs;

public sealed class IdentityLinkEmailMessageDto
{
    public string RecipientName { get; set; } = string.Empty;

    public string RecipientEmail { get; set; } = string.Empty;

    public string RoleCode { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string ApprovalStatus { get; set; } = string.Empty;

    public DateTime RequestedAtUtc { get; set; }

    public DateTime? ApprovedAtUtc { get; set; }

    public DateTime IdentityLinkExpiresAtUtc { get; set; }

    public string Link { get; set; } = string.Empty;

    public IReadOnlyList<IdentityLinkAssessmentEmailDetailDto> Assessments { get; set; } = Array.Empty<IdentityLinkAssessmentEmailDetailDto>();
}

public sealed class IdentityLinkAssessmentEmailDetailDto
{
    public Guid AssessmentId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Departments { get; set; } = string.Empty;

    public int QuestionCount { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }
}
