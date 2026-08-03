namespace qMRI.Api.Configuration.Options;

public sealed class OpenAiOptions
{
    public const string SectionName = "OpenAI";

    public string ApiKey { get; init; } = string.Empty;

    public string Model { get; init; } = "gpt-5-mini";

    public int MaxOutputTokens { get; init; } = 6000;

    public string ReasoningEffort { get; init; } = "minimal";

    public string Verbosity { get; init; } = "low";
}

