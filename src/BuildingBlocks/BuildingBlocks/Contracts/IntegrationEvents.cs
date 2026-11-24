namespace Coaching.BuildingBlocks.Contracts;

// Integration events shared between services. Keep them small, immutable, and versioned by additive change only.
public record StudentEnrolled(
    Guid StudentId,
    string FullName,
    int ClassLevel,
    string? DeviceUserId,
    string GuardianPhone,
    bool IsActive = true);
public record DevicePunchReceived(string DeviceSerial, string RoomCode, string DeviceUserId, DateTimeOffset PunchedAt);
public record AttendanceMarked(Guid SessionId, Guid StudentId, string Status, DateTimeOffset MarkedAt);
public record ExamResultPublished(Guid ExamId, Guid StudentId, decimal Marks, decimal TotalMarks);
