namespace qMRI.Domain.Assessments.Entities;

public sealed class DashboardSetting
{
    public Guid DashboardSettingId { get; set; }

    public string SettingKey { get; set; } = string.Empty;

    public Guid? UserId { get; set; }

    public string ValueJson { get; set; } = string.Empty;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
