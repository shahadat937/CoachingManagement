using Coaching.BuildingBlocks;
using Coaching.BuildingBlocks.Contracts;
using Coaching.Devices.Domain;
using MediatR;
using System.Security.Cryptography;

namespace Coaching.Devices.Application.Features;

public record RegisterDeviceCommand(string Serial, string Name, string RoomCode, DeviceType Type) : IRequest<string>;

public class RegisterDeviceHandler(IDeviceStore store) : IRequestHandler<RegisterDeviceCommand, string>
{
    public async Task<string> Handle(RegisterDeviceCommand c, CancellationToken ct)
    {
        if (await store.GetBySerialAsync(c.Serial, ct) is not null) throw new InvalidOperationException("Device already registered");
        var key = Convert.ToHexString(RandomNumberGenerator.GetBytes(24));
        await store.AddAsync(new Device { Serial = c.Serial, Name = c.Name, RoomCode = c.RoomCode, Type = c.Type, ApiKey = key }, ct);
        return key; // shown once; configure it on the device / bridge
    }
}

public record DeviceRow(string Serial, string Name, string RoomCode, DeviceType Type, bool IsActive, DateTimeOffset? LastSeenAt);
public record ListDevicesQuery : IRequest<IReadOnlyList<DeviceRow>>;

public class ListDevicesHandler(IDeviceStore store) : IRequestHandler<ListDevicesQuery, IReadOnlyList<DeviceRow>>
{
    public async Task<IReadOnlyList<DeviceRow>> Handle(ListDevicesQuery q, CancellationToken ct) =>
        (await store.ListAsync(ct)).Select(d => new DeviceRow(d.Serial, d.Name, d.RoomCode, d.Type, d.IsActive, d.LastSeenAt)).ToList();
}

public record PunchItem(string DeviceUserId, DateTimeOffset PunchedAt);
public record IngestPunchesCommand(string Serial, string ApiKey, IReadOnlyList<PunchItem> Punches) : IRequest<int>;

public class IngestPunchesHandler(IDeviceStore store, IEventBus bus) : IRequestHandler<IngestPunchesCommand, int>
{
    public async Task<int> Handle(IngestPunchesCommand c, CancellationToken ct)
    {
        var device = await store.GetBySerialAsync(c.Serial, ct);
        if (device is null || !device.IsActive || !CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.UTF8.GetBytes(device.ApiKey), System.Text.Encoding.UTF8.GetBytes(c.ApiKey)))
            throw new UnauthorizedAccessException("Unknown device or bad key");

        var raw = c.Punches.Select(p => new DevicePunch { DeviceSerial = c.Serial, DeviceUserId = p.DeviceUserId, PunchedAt = p.PunchedAt, RoomCode = device.RoomCode }).ToList();
        await store.AddPunchesAsync(raw, ct);
        await store.TouchAsync(c.Serial, DateTimeOffset.UtcNow, ct);
        foreach (var p in raw)
            await bus.PublishAsync(new DevicePunchReceived(p.DeviceSerial, p.RoomCode, p.DeviceUserId, p.PunchedAt), ct);
        return raw.Count;
    }
}
