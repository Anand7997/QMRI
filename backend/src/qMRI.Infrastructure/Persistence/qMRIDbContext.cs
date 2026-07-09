using Microsoft.EntityFrameworkCore;
using qMRI.Domain.Assessments.Entities;
using qMRI.Domain.Common.Entities;

namespace qMRI.Infrastructure.Persistence;

public sealed class qMRIDbContext : DbContext
{
    public qMRIDbContext(DbContextOptions<qMRIDbContext> options)
        : base(options)
    {
    }

    public DbSet<HealthCheck> HealthChecks => Set<HealthCheck>();

    public DbSet<User> Users => Set<User>();

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<UserRole> UserRoles => Set<UserRole>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Module> Modules => Set<Module>();

    public DbSet<SubModule> SubModules => Set<SubModule>();

    public DbSet<Question> Questions => Set<Question>();

    public DbSet<ScoringModel> ScoringModels => Set<ScoringModel>();

    public DbSet<ScoringRule> ScoringRules => Set<ScoringRule>();

    public DbSet<MaturityBand> MaturityBands => Set<MaturityBand>();

    public DbSet<Assessment> Assessments => Set<Assessment>();

    public DbSet<AssessmentResponse> AssessmentResponses => Set<AssessmentResponse>();

    public DbSet<AssessmentScore> AssessmentScores => Set<AssessmentScore>();

    public DbSet<Recommendation> Recommendations => Set<Recommendation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(qMRIDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
