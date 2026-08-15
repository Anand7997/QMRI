using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class GovernanceAuditEntryConfiguration : IEntityTypeConfiguration<GovernanceAuditEntry>
{
    public void Configure(EntityTypeBuilder<GovernanceAuditEntry> builder)
    {
        builder.ToTable("GovernanceAuditEntries", "asmt");

        builder.HasKey(entity => entity.GovernanceAuditEntryId);

        builder.Property(entity => entity.GovernanceAuditEntryId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Actor)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Action)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.EntityType)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(entity => entity.EntityName)
            .HasMaxLength(240)
            .IsRequired();

        builder.Property(entity => entity.Details)
            .HasMaxLength(1000);

        builder.Property(entity => entity.HappenedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.HasIndex(entity => entity.HappenedAtUtc);
        builder.HasIndex(entity => entity.EntityType);
    }
}
