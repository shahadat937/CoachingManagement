using Coaching.Identity.Domain;

namespace Coaching.Identity.Application;

public interface IAppUserStore
{
    Task<AppUser?> FindByEmailAsync(string normalizedEmail, CancellationToken ct = default);
    Task<bool> HasRoleAsync(string role, CancellationToken ct = default);
    Task<IReadOnlyList<AppUser>> ListAsync(CancellationToken ct = default);
    Task AddAsync(AppUser user, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public sealed record IssuedAccessToken(string Value, DateTimeOffset ExpiresAt);

public interface ITokenIssuer
{
    IssuedAccessToken Issue(AppUser user);
}
