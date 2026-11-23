using Coaching.BuildingBlocks;

namespace Coaching.Identity.Domain;

public class RefreshToken : Entity
{
    private RefreshToken() { }

    public RefreshToken(Guid userId, string tokenHash, DateTimeOffset expiresAt)
    {
        UserId = userId;
        TokenHash = string.IsNullOrWhiteSpace(tokenHash)
            ? throw new ArgumentException("A refresh token hash is required.", nameof(tokenHash))
            : tokenHash;
        ExpiresAt = expiresAt;
    }

    public Guid UserId { get; private set; }
    public string TokenHash { get; private set; } = default!;
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public string? ReplacedByTokenHash { get; private set; }

    public bool IsActive(DateTimeOffset now) => RevokedAt is null && ExpiresAt > now;

    public void Revoke(DateTimeOffset revokedAt, string? replacedByTokenHash = null)
    {
        if (RevokedAt is not null)
            return;

        RevokedAt = revokedAt;
        ReplacedByTokenHash = replacedByTokenHash;
    }
}
