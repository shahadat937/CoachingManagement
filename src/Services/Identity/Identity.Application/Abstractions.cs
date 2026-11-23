using Coaching.Identity.Domain;

namespace Coaching.Identity.Application;

public interface IAppUserStore
{
    Task<AppUser?> FindByEmailAsync(string normalizedEmail, CancellationToken ct = default);
    Task<AppUser?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> HasRoleAsync(string role, CancellationToken ct = default);
    Task<IReadOnlyList<AppUser>> ListAsync(CancellationToken ct = default);
    Task AddAsync(AppUser user, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public interface IRefreshTokenStore
{
    Task<RefreshToken?> FindByTokenHashAsync(string tokenHash, CancellationToken ct = default);
    Task AddAsync(RefreshToken refreshToken, CancellationToken ct = default);
    Task<bool> TryRotateAsync(
        RefreshToken current,
        RefreshToken replacement,
        DateTimeOffset revokedAt,
        CancellationToken ct = default);
    Task RevokeActiveForUserAsync(Guid userId, DateTimeOffset revokedAt, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public sealed record IssuedRefreshToken(string Value, string Hash, DateTimeOffset ExpiresAt);

public interface IRefreshTokenFactory
{
    IssuedRefreshToken Create(DateTimeOffset now);
    string Hash(string token);
}

public sealed record IssuedAccessToken(string Value, DateTimeOffset ExpiresAt);

public interface ITokenIssuer
{
    IssuedAccessToken Issue(AppUser user);
}
