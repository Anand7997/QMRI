namespace qMRI.Api.Configuration.Options;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "qMRI";

    public string Audience { get; set; } = "qMRI.Client";

    public string SigningKey { get; set; } = "CHANGE_ME_FOR_REAL_ENVIRONMENT";

    public int AccessTokenMinutes { get; set; } = 30;

    public int RefreshTokenDays { get; set; } = 7;
}
