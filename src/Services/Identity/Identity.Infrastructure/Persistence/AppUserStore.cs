using Coaching.Identity.Application;
using Coaching.Identity.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Identity.Infrastructure.Persistence;

public sealed class AppUserStore(IdentityDbContext db) : IAppUserStore
{
    public Task<AppUser?> FindByEmailAsync(string normalizedEmail, CancellationToken ct = default) =>
        db.AppUsers.OrderBy(user => user.Id)
            .FirstOrDefaultAsync(user => user.Email.ToLower() == normalizedEmail, ct);

    public Task<bool> HasRoleAsync(string role, CancellationToken ct = default) =>
        db.AppUsers.AnyAsync(user => user.Role == role, ct);

    public async Task<IReadOnlyList<AppUser>> ListAsync(CancellationToken ct = default) =>
        await db.AppUsers.AsNoTracking().OrderBy(user => user.Email).ToListAsync(ct);

    public Task AddAsync(AppUser user, CancellationToken ct = default) => db.AppUsers.AddAsync(user, ct).AsTask();

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
