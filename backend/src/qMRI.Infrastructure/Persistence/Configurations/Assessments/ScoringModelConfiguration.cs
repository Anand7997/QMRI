using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class ScoringModelConfiguration : IEntityTypeConfiguration<ScoringModel>
{
    public void Configure(EntityTypeBuilder<ScoringModel> builder)
    {
        builder.ToTable("ScoringModels", "asmt");

        builder.HasKey(entity => entity.ScoringModelId);

        builder.Property(entity => entity.ScoringModelId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Description)
            .HasMaxLength(1000);

        builder.Property(entity => entity.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(entity => entity.CreatedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.HasIndex(entity => entity.Name)
            .IsUnique();

        builder.HasMany(entity => entity.Rules)
            .WithOne(rule => rule.ScoringModel)
            .HasForeignKey(rule => rule.ScoringModelId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(entity => entity.MaturityBands)
            .WithOne(band => band.ScoringModel)
            .HasForeignKey(band => band.ScoringModelId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
