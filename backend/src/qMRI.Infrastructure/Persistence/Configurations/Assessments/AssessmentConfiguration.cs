using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;
using qMRI.Domain.Common.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class AssessmentConfiguration : IEntityTypeConfiguration<Assessment>
{
    public void Configure(EntityTypeBuilder<Assessment> builder)
    {
        builder.ToTable("Assessments", "asmt");

        builder.HasKey(entity => entity.AssessmentId);

        builder.Property(entity => entity.AssessmentId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Description)
            .HasMaxLength(1000);

        builder.Property(entity => entity.Departments)
            .HasMaxLength(512);

        builder.Property(entity => entity.SelectedQuestionIds)
            .HasColumnType("nvarchar(max)");

        builder.Property(entity => entity.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(entity => entity.StartedAtUtc)
            .HasColumnType("datetime2");

        builder.Property(entity => entity.SubmittedAtUtc)
            .HasColumnType("datetime2");

        builder.Property(entity => entity.ScoredAtUtc)
            .HasColumnType("datetime2");

        builder.Property(entity => entity.CreatedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        // Assessed subject → sec.Users (no reverse navigation on User).
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(entity => entity.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(entity => entity.ScoringModel)
            .WithMany()
            .HasForeignKey(entity => entity.ScoringModelId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(entity => entity.UserId);
        builder.HasIndex(entity => entity.Status);
    }
}

