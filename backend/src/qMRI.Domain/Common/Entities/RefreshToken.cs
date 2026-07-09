namespace qMRI.Domain.Common.Entities;

public sealed class RefreshToken
{
    public Guid RefreshTokenId { get; set; }

    public Guid UserId { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public bool IsRevoked { get; set; }

    public DateTime? RevokedAtUtc { get; set; }

    public User? User { get; set; }
}
