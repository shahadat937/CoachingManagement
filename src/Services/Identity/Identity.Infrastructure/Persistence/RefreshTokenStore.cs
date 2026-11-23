using Coaching.Identity.Application;
using Coaching.Identity.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Identity.Infrastructure.Persistence;

public sealed class RefreshTokenStore(IdentityDbContext db) : IRefreshTokenStore
{
    public Task<RefreshToken?> FindByTokenHashAsync(string tokenHash, CancellationToken ct = default) =>
        db.RefreshTokens.SingleOrDefaultAsync(token => token.TokenHash == tokenHash, ct);

    public Task AddAsync(RefreshToken refreshToken, CancellationToken ct = default) =>
        db.RefreshTokens.AddAsync(refreshToken, ct).AsTask();

    public async Task<bool> TryRotateAsync(
        RefreshToken current,
        RefreshToken replacement,
        DateTimeOffset revokedAt,
        CancellationToken ct = default)
    {
        // The conditional update makes a refresh token single-use even when requests race.
        // Detach the token read earlier so this context cannot later overwrite the direct update.
        db.Entry(current).State = EntityState.Detached;

        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var updated = await db.RefreshTokens
            .Where(token => token.Id == current.Id
                && token.TokenHash == current.TokenHash
                && token.RevokedAt == null
                && token.ExpiresAt > revokedAt)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(token => token.RevokedAt, revokedAt)
                .SetProperty(token => token.ReplacedByTokenHash, replacement.TokenHash), ct);

        if (updated != 1)
        {
            await transaction.RollbackAsync(ct);
            return false;
        }

        await db.RefreshTokens.AddAsync(replacement, ct);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return true;
    }

    public async Task RevokeActiveForUserAsync(Guid userId, DateTimeOffset revokedAt, CancellationToken ct = default) =>
        await db.RefreshTokens
            .Where(token => token.UserId == userId && token.RevokedAt == null && token.ExpiresAt > revokedAt)
            .ExecuteUpdateAsync(setters => setters.SetProperty(token => token.RevokedAt, revokedAt), ct);

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
