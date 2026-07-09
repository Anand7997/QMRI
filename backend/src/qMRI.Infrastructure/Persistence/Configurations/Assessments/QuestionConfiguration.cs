using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.ToTable("Questions", "asmt");

        builder.HasKey(entity => entity.QuestionId);

        builder.Property(entity => entity.QuestionId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.Text)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(entity => entity.Guidance)
            .HasMaxLength(4000);

        builder.Property(entity => entity.Weight)
            .HasPrecision(5, 2);

        builder.Property(entity => entity.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.HasIndex(entity => entity.SubModuleId);
    }
}
