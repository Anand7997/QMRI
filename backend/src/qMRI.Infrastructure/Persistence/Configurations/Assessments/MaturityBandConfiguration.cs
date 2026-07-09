using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class MaturityBandConfiguration : IEntityTypeConfiguration<MaturityBand>
{
    public void Configure(EntityTypeBuilder<MaturityBand> builder)
    {
        builder.ToTable("MaturityBands", "asmt");

        builder.HasKey(entity => entity.MaturityBandId);

        builder.Property(entity => entity.MaturityBandId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.MinScore)
            .HasPrecision(5, 2);

        builder.Property(entity => entity.MaxScore)
            .HasPrecision(5, 2);

        builder.Property(entity => entity.Level)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(entity => entity.Label)
            .HasMaxLength(100);

        builder.Property(entity => entity.TmmiLevel)
            .HasMaxLength(100);

        builder.HasIndex(entity => new { entity.ScoringModelId, entity.SortOrder });
    }
}
