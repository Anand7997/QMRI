using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Common.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Security;

public sealed class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.ToTable("UserRoles", "sec");

        builder.HasKey(entity => new { entity.UserId, entity.RoleId });

        builder.Property(entity => entity.AssignedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.HasOne(entity => entity.User)
            .WithMany(user => user.UserRoles)
            .HasForeignKey(entity => entity.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(entity => entity.Role)
            .WithMany(role => role.UserRoles)
            .HasForeignKey(entity => entity.RoleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
