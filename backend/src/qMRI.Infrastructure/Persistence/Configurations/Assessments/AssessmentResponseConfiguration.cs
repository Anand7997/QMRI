using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class AssessmentResponseConfiguration : IEntityTypeConfiguration<AssessmentResponse>
{
    public void Configure(EntityTypeBuilder<AssessmentResponse> builder)
    {
        builder.ToTable("AssessmentResponses", "asmt");

        builder.HasKey(entity => entity.AssessmentResponseId);

        builder.Property(entity => entity.AssessmentResponseId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Answer)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(entity => entity.Points)
            .HasPrecision(6, 2);

        builder.Property(entity => entity.Findings)
            .HasMaxLength(4000);

        builder.Property(entity => entity.AnsweredAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.HasOne(entity => entity.Assessment)
            .WithMany(assessment => assessment.Responses)
            .HasForeignKey(entity => entity.AssessmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Restrict to avoid multiple cascade paths into AssessmentResponses
        // (Assessment already cascades).
        builder.HasOne(entity => entity.Question)
            .WithMany(question => question.Responses)
            .HasForeignKey(entity => entity.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(entity => new { entity.AssessmentId, entity.QuestionId })
            .IsUnique();

        builder.HasIndex(entity => entity.QuestionId);
    }
}
