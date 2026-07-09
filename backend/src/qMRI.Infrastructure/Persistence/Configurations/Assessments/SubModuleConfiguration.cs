using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class SubModuleConfiguration : IEntityTypeConfiguration<SubModule>
{
    public void Configure(EntityTypeBuilder<SubModule> builder)
    {
        builder.ToTable("SubModules", "asmt");

        builder.HasKey(entity => entity.SubModuleId);

        builder.Property(entity => entity.SubModuleId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Code)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(entity => entity.Name)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(entity => entity.Description)
            .HasMaxLength(1000);

        builder.Property(entity => entity.Weight)
            .HasPrecision(5, 2);

        builder.Property(entity => entity.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.HasIndex(entity => new { entity.ModuleId, entity.Code })
            .IsUnique();

        builder.HasMany(entity => entity.Questions)
            .WithOne(question => question.SubModule)
            .HasForeignKey(question => question.SubModuleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
