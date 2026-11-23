using Microsoft.EntityFrameworkCore;

namespace Coaching.BuildingBlocks.Persistence;

public class EfRepository<T>(DbContext db) : IRepository<T> where T : Entity
{
    public Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default) => db.Set<T>().FirstOrDefaultAsync(x => x.Id == id, ct);
    public async Task<IReadOnlyList<T>> ListAsync(CancellationToken ct = default) => await db.Set<T>().AsNoTracking().ToListAsync(ct);
    public async Task AddAsync(T entity, CancellationToken ct = default) => await db.Set<T>().AddAsync(entity, ct);
    public Task<int> SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
