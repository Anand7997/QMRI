using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class DashboardSettingConfiguration : IEntityTypeConfiguration<DashboardSetting>
{
    public void Configure(EntityTypeBuilder<DashboardSetting> builder)
    {
        builder.ToTable("DashboardSettings", "asmt");

        builder.HasKey(entity => entity.DashboardSettingId);

        builder.Property(entity => entity.DashboardSettingId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.SettingKey)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(entity => entity.ValueJson)
            .HasColumnType("nvarchar(max)")
            .IsRequired();

        builder.Property(entity => entity.UpdatedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.HasIndex(entity => new { entity.SettingKey, entity.UserId })
            .IsUnique();
    }
}
