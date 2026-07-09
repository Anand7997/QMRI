using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Common.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Security;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users", "sec");

        builder.HasKey(entity => entity.UserId);

        builder.Property(entity => entity.UserId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.UserName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(entity => entity.FullName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(entity => entity.PasswordHash)
            .HasMaxLength(512)
            .IsRequired();

        builder.Property(entity => entity.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(entity => entity.ApprovalStatus)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(entity => entity.RequestedRoleCode)
            .HasMaxLength(64)
            .HasDefaultValue("USER")
            .IsRequired();

        builder.Property(entity => entity.RequestedAtUtc)
            .HasColumnType("datetime2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();

        builder.Property(entity => entity.ApprovedAtUtc)
            .HasColumnType("datetime2");

        builder.Property(entity => entity.ApprovedByUserId);

        builder.Property(entity => entity.CreatedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.HasIndex(entity => entity.UserName)
            .IsUnique();

        builder.HasIndex(entity => entity.Email)
            .IsUnique();

        builder.HasIndex(entity => entity.ApprovalStatus);
    }
}