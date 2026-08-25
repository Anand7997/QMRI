namespace qMRI.Infrastructure.Authentication.Options;

public sealed class IdentityLinkEmailOptions
{
    public const string SectionName = "Email";

    public bool Enabled { get; set; }

    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 587;

    public bool UseSsl { get; set; } = true;

    public string FromAddress { get; set; } = string.Empty;

    public string FromName { get; set; } = "qMRI";

    public string UserName { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public int TimeoutSeconds { get; set; } = 30;
}
