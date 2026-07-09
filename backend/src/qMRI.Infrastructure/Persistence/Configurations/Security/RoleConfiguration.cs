using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Common.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Security;

public sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles", "sec");

        builder.HasKey(entity => entity.RoleId);

        builder.Property(entity => entity.RoleId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Code)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(entity => entity.Name)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(entity => entity.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.HasIndex(entity => entity.Code)
            .IsUnique();
    }
}
