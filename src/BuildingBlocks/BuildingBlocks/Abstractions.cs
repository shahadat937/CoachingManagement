namespace Coaching.BuildingBlocks;

public interface IRepository<T> where T : Entity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> ListAsync(CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

/// <summary>Publishes integration events to the message broker (implemented in BuildingBlocks.Messaging).</summary>
public interface IEventBus
{
    Task PublishAsync<T>(T @event, CancellationToken ct = default) where T : class;
}
