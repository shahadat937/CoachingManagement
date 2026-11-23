using Coaching.BuildingBlocks;

namespace Coaching.Devices.Domain;

public enum DeviceType { Fingerprint = 1, Rfid = 2, Face = 3 }

public class Device : Entity
{
    public string Serial { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string RoomCode { get; set; } = default!;   // where the device is mounted; used to resolve the subject session
    public DeviceType Type { get; set; }
    public string ApiKey { get; set; } = default!;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? LastSeenAt { get; set; }
}

/// <summary>Immutable raw log of every punch. Kept in MongoDB: high-volume, append-only.</summary>
public class DevicePunch : Entity
{
    public string DeviceSerial { get; set; } = default!;
    public string DeviceUserId { get; set; } = default!;
    public DateTimeOffset PunchedAt { get; set; }
    public string RoomCode { get; set; } = default!;
}
