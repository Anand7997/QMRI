using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using qMRI.Domain.Common.Entities;

namespace qMRI.Infrastructure.Persistence.Configurations.Security;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens", "sec");

        builder.HasKey(entity => entity.RefreshTokenId);

        builder.Property(entity => entity.RefreshTokenId)
            .ValueGeneratedNever();

        builder.Property(entity => entity.TokenHash)
            .HasMaxLength(512)
            .IsRequired();

        builder.Property(entity => entity.CreatedAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.Property(entity => entity.ExpiresAtUtc)
            .HasColumnType("datetime2")
            .IsRequired();

        builder.Property(entity => entity.RevokedAtUtc)
            .HasColumnType("datetime2");

        builder.Property(entity => entity.IsRevoked)
            .HasDefaultValue(false)
            .IsRequired();

        builder.HasOne(entity => entity.User)
            .WithMany(user => user.RefreshTokens)
            .HasForeignKey(entity => entity.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(entity => entity.UserId);
    }
}
