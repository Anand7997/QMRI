using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class ModuleConfiguration : IEntityTypeConfiguration<Module>
{
    public void Configure(EntityTypeBuilder<Module> builder)
    {
        builder.ToTable("Modules", "asmt");

        builder.HasKey(entity => entity.ModuleId);

        builder.Property(entity => entity.ModuleId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Code)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(entity => entity.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Description)
            .HasMaxLength(1000);

        builder.Property(entity => entity.Weight)
            .HasPrecision(5, 2);

        builder.Property(entity => entity.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(entity => entity.CreatedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.HasIndex(entity => new { entity.CategoryId, entity.Code })
            .IsUnique();

        builder.HasMany(entity => entity.SubModules)
            .WithOne(subModule => subModule.Module)
            .HasForeignKey(subModule => subModule.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
