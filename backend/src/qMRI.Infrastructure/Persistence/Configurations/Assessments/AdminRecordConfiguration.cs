using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Assessments.Entities;
using qMRI.Domain.Common.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Assessments;

public sealed class AdminRecordConfiguration : IEntityTypeConfiguration<AdminRecord>
{
    public void Configure(EntityTypeBuilder<AdminRecord> builder)
    {
        builder.ToTable("Admin_record", "asmt");

        builder.HasKey(entity => entity.AdminRecordId);

        builder.Property(entity => entity.AdminRecordId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.AssignedByUserName)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(entity => entity.AssignedByFullName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.AssignedToUserName)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(entity => entity.AssignedToFullName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.AssignedDepartments)
            .HasMaxLength(512);

        builder.Property(entity => entity.AssignedQuestionIds)
            .HasColumnType("nvarchar(max)");

        builder.Property(entity => entity.AssignedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.HasOne<Assessment>()
            .WithMany()
            .HasForeignKey(entity => entity.AssessmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(entity => entity.AssignedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(entity => entity.AssignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(entity => entity.AssessmentId);
        builder.HasIndex(entity => entity.AssignedByUserId);
        builder.HasIndex(entity => entity.AssignedToUserId);
        builder.HasIndex(entity => entity.AssignedAtUtc);
    }
}
