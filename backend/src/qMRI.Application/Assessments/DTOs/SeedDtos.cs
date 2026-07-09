namespace qMRI.Application.Assessments.DTOs;

public sealed class SeedAssessmentRequest
{
    public bool OverwriteExisting { get; set; }
}

public sealed class SeedAssessmentResultDto
{
    public int CategoriesCreated { get; set; }
    public int ModulesCreated { get; set; }
    public int SubModulesCreated { get; set; }
    public int QuestionsCreated { get; set; }
    public int ScoringModelsCreated { get; set; }
    public int UsersCreated { get; set; }
    public int RecordsUpdated { get; set; }
    public bool SeedAlreadyPresent { get; set; }
}
