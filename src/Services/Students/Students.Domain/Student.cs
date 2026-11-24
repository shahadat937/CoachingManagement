using Coaching.BuildingBlocks;

namespace Coaching.Students.Domain;

public class Student : Entity
{
    public string StudentNo { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public int ClassLevel { get; set; } // 1..12
    public string GuardianPhone { get; set; } = default!;
    public string? DeviceUserId { get; set; } // id enrolled on the fingerprint / RFID / face device
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? DeactivatedAt { get; set; }
}
