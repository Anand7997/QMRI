using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class RecommendationConfiguration : IEntityTypeConfiguration<Recommendation>
{
    public void Configure(EntityTypeBuilder<Recommendation> builder)
    {
        builder.ToTable("Recommendations", "asmt");

        builder.HasKey(entity => entity.RecommendationId);

        builder.Property(entity => entity.RecommendationId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(entity => entity.Priority)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(entity => entity.CreatedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.HasOne(entity => entity.Assessment)
            .WithMany(assessment => assessment.Recommendations)
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

        builder.HasIndex(entity => entity.AssessmentId);
    }
}
