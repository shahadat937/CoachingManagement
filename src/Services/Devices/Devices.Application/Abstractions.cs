using Coaching.Devices.Domain;

namespace Coaching.Devices.Application;

public interface IDeviceStore
{
    Task<Device?> GetBySerialAsync(string serial, CancellationToken ct);
    Task<IReadOnlyList<Device>> ListAsync(CancellationToken ct);
    Task AddAsync(Device d, CancellationToken ct);
    Task TouchAsync(string serial, DateTimeOffset seenAt, CancellationToken ct);
    Task AddPunchesAsync(IEnumerable<DevicePunch> punches, CancellationToken ct);
}
