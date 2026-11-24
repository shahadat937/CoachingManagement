using Coaching.BuildingBlocks;

namespace Coaching.Attendance.Domain;

public enum AttendanceStatus { Present = 1, Late = 2, Absent = 3, Excused = 4 }
public enum AttendanceSource { Device = 1, Manual = 2 }

/// <summary>One scheduled class period: Class (1-12) + Subject + Room + time window.</summary>
public class ClassSession : Entity
{
    public int ClassLevel { get; private set; }
    public Guid SubjectId { get; private set; }
    public string SubjectName { get; private set; } = default!;
    public string RoomCode { get; private set; } = default!;
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset EndsAt { get; private set; }
    public int LateAfterMinutes { get; private set; }

    private ClassSession() { }

    public ClassSession(int classLevel, Guid subjectId, string subjectName, string roomCode,
        DateTimeOffset startsAt, DateTimeOffset endsAt, int lateAfterMinutes = 10)
    {
        if (classLevel is < 1 or > 12) throw new ArgumentOutOfRangeException(nameof(classLevel), "Class must be 1-12");
        if (endsAt <= startsAt) throw new ArgumentException("Session must end after it starts");
        ClassLevel = classLevel; SubjectId = subjectId; SubjectName = subjectName; RoomCode = roomCode;
        StartsAt = startsAt; EndsAt = endsAt; LateAfterMinutes = lateAfterMinutes;
    }

    /// <summary>Punches are accepted from 15 min before start until the session ends.</summary>
    public bool AcceptsPunchAt(DateTimeOffset t) => t >= StartsAt.AddMinutes(-15) && t <= EndsAt;

    public AttendanceStatus StatusFor(DateTimeOffset t) =>
        t > StartsAt.AddMinutes(LateAfterMinutes) ? AttendanceStatus.Late : AttendanceStatus.Present;
}

public class AttendanceRecord : Entity
{
    public Guid SessionId { get; private set; }
    public Guid StudentId { get; private set; }
    public AttendanceStatus Status { get; private set; }
    public AttendanceSource Source { get; private set; }
    public DateTimeOffset MarkedAt { get; private set; }
    public string? DeviceSerial { get; private set; }

    private AttendanceRecord() { }

    public AttendanceRecord(Guid sessionId, Guid studentId, AttendanceStatus status, AttendanceSource source,
        DateTimeOffset markedAt, string? deviceSerial = null)
    {
        SessionId = sessionId; StudentId = studentId; Status = status; Source = source;
        MarkedAt = markedAt; DeviceSerial = deviceSerial;
    }

    public void Change(AttendanceStatus status, AttendanceSource source)
    {
        Status = status; Source = source; MarkedAt = DateTimeOffset.UtcNow;
    }
}

/// <summary>Local read-model of a student, kept in sync via the StudentEnrolled event.</summary>
public class StudentRef
{
    public Guid StudentId { get; set; }
    public string FullName { get; set; } = default!;
    public int ClassLevel { get; set; }
    public string? DeviceUserId { get; set; }
    public bool IsActive { get; set; } = true;
}
