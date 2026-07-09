using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Common.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations;

public sealed class HealthCheckConfiguration : IEntityTypeConfiguration<HealthCheck>
{
    public void Configure(EntityTypeBuilder<HealthCheck> builder)
    {
        builder.ToTable("HealthCheck");

        builder.HasKey(entity => entity.HealthCheckId);

        builder.Property(entity => entity.HealthCheckId)
            .ValueGeneratedOnAdd();

        builder.Property(entity => entity.Status)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(entity => entity.CreatedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();
    }
}