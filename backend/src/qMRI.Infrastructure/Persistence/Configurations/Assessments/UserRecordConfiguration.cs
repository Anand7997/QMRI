using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;
using qMRI.Domain.Common.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class UserRecordConfiguration : IEntityTypeConfiguration<UserRecord>
{
    public void Configure(EntityTypeBuilder<UserRecord> builder)
    {
        builder.ToTable("user_record", "asmt");

        builder.HasKey(entity => entity.UserRecordId);

        builder.Property(entity => entity.UserRecordId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.UserName)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(entity => entity.FullName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.CreatedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.Property(entity => entity.StartedAtUtc)
            .HasColumnType("datetime2");

        builder.Property(entity => entity.EndedAtUtc)
            .HasColumnType("datetime2");

        builder.Property(entity => entity.RecordDateUtc)
            .HasColumnType("date")
            .IsRequired();

        builder.HasOne<Assessment>()
            .WithMany()
            .HasForeignKey(entity => entity.AssessmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(entity => entity.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(entity => entity.AssessmentId)
            .IsUnique();
        builder.HasIndex(entity => entity.UserId);
        builder.HasIndex(entity => entity.RecordDateUtc);
    }
}
