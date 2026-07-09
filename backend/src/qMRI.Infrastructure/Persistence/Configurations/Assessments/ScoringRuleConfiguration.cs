using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class ScoringRuleConfiguration : IEntityTypeConfiguration<ScoringRule>
{
    public void Configure(EntityTypeBuilder<ScoringRule> builder)
    {
        builder.ToTable("ScoringRules", "asmt");

        builder.HasKey(entity => entity.ScoringRuleId);

        builder.Property(entity => entity.ScoringRuleId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Answer)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(entity => entity.Points)
            .HasPrecision(6, 2);

        builder.HasIndex(entity => new { entity.ScoringModelId, entity.Answer })
            .IsUnique();
    }
}
