namespace qMRI.Api.Configuration.Options;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    public int CommandTimeoutSeconds { get; set; } = 30;

    public bool EnableSensitiveDataLogging { get; set; }
}
