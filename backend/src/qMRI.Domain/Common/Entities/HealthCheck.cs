namespace qMRI.Domain.Common.Entities;

public sealed class HealthCheck
{
    public int HealthCheckId { get; set; }

    public string Status { get; set; } = "Healthy";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}