using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories", "asmt");

        builder.HasKey(entity => entity.CategoryId);

        builder.Property(entity => entity.CategoryId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Code)
            .HasMaxLength(64)
            .IsRequired();

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

        builder.HasIndex(entity => entity.Code)
            .IsUnique();

        builder.HasMany(entity => entity.Modules)
            .WithOne(module => module.Category)
            .HasForeignKey(module => module.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
