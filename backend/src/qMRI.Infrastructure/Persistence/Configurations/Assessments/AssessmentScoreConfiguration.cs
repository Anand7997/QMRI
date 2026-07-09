using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class AssessmentScoreConfiguration : IEntityTypeConfiguration<AssessmentScore>
{
    public void Configure(EntityTypeBuilder<AssessmentScore> builder)
    {
        builder.ToTable("AssessmentScores", "asmt");

        builder.HasKey(entity => entity.AssessmentScoreId);

        builder.Property(entity => entity.AssessmentScoreId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Scope)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(entity => entity.Score)
            .HasPrecision(5, 2);

        builder.Property(entity => entity.MaturityLevel)
            .HasMaxLength(100);

        builder.Property(entity => entity.CalculatedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.HasOne(entity => entity.Assessment)
            .WithMany(assessment => assessment.Scores)
            .HasForeignKey(entity => entity.AssessmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Optional scope targets; restrict to avoid multiple cascade paths.
        builder.HasOne(entity => entity.Category)
            .WithMany()
            .HasForeignKey(entity => entity.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(entity => entity.Module)
            .WithMany()
            .HasForeignKey(entity => entity.ModuleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(entity => entity.SubModule)
            .WithMany()
            .HasForeignKey(entity => entity.SubModuleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(entity => new { entity.AssessmentId, entity.Scope });
    }
}
