namespace qMRI.Infrastructure.Assessments.Services;

internal static class AssessmentSeedDefaults
{
    public static readonly Guid DefaultScoringModelId = Guid.Parse("30000000-0000-0000-0000-000000000001");
    public static readonly Guid AdminRoleId = Guid.Parse("30000000-0000-0000-0000-000000000101");
    public static readonly Guid AssessmentUserRoleId = Guid.Parse("30000000-0000-0000-0000-000000000102");
    public static readonly Guid AdminUserId = Guid.Parse("30000000-0000-0000-0000-000000000201");
    public static readonly Guid AssessmentUserId = Guid.Parse("30000000-0000-0000-0000-000000000202");

    public const string DefaultScoringModelName = "TOPP Default Yes/Partial/No";
    public const string AdminRoleCode = "Admin";
    public const string AssessmentUserRoleCode = "AssessmentUser";
}
