using Coaching.Attendance.Domain;

namespace Coaching.Attendance.Application;

public interface IAttendanceStore
{
    Task<ClassSession?> GetSessionAsync(Guid id, CancellationToken ct);
    Task<ClassSession?> FindOpenSessionAsync(int classLevel, string roomCode, DateTimeOffset at, CancellationToken ct);
    Task AddSessionAsync(ClassSession session, CancellationToken ct);
    Task<AttendanceRecord?> GetRecordAsync(Guid sessionId, Guid studentId, CancellationToken ct);
    Task AddRecordAsync(AttendanceRecord record, CancellationToken ct);
    Task<IReadOnlyList<AttendanceRecord>> ListRecordsAsync(Guid sessionId, CancellationToken ct);
    Task<StudentRef?> FindStudentByDeviceUserIdAsync(string deviceUserId, CancellationToken ct);
    Task UpsertStudentAsync(StudentRef student, CancellationToken ct);
    Task<int> SaveChangesAsync(CancellationToken ct);
}
