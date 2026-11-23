using Coaching.Attendance.Application;
using Coaching.Attendance.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Attendance.Infrastructure;

public class AttendanceStore(AttendanceDbContext db) : IAttendanceStore
{
    public Task<ClassSession?> GetSessionAsync(Guid id, CancellationToken ct) => db.Sessions.FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<ClassSession?> FindOpenSessionAsync(int classLevel, string roomCode, DateTimeOffset at, CancellationToken ct) =>
        db.Sessions.Where(x => x.ClassLevel == classLevel && x.RoomCode == roomCode
                            && x.StartsAt <= at.AddMinutes(15) && x.EndsAt >= at)
                   .OrderBy(x => x.StartsAt).FirstOrDefaultAsync(ct);

    public async Task AddSessionAsync(ClassSession s, CancellationToken ct) => await db.Sessions.AddAsync(s, ct);
    public Task<AttendanceRecord?> GetRecordAsync(Guid sessionId, Guid studentId, CancellationToken ct) =>
        db.Records.FirstOrDefaultAsync(x => x.SessionId == sessionId && x.StudentId == studentId, ct);
    public async Task AddRecordAsync(AttendanceRecord r, CancellationToken ct) => await db.Records.AddAsync(r, ct);
    public async Task<IReadOnlyList<AttendanceRecord>> ListRecordsAsync(Guid sessionId, CancellationToken ct) =>
        await db.Records.AsNoTracking().Where(x => x.SessionId == sessionId).ToListAsync(ct);
    public Task<StudentRef?> FindStudentByDeviceUserIdAsync(string id, CancellationToken ct) =>
        db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.DeviceUserId == id, ct);

    public async Task UpsertStudentAsync(StudentRef s, CancellationToken ct)
    {
        var e = await db.Students.FindAsync([s.StudentId], ct);
        if (e is null) await db.Students.AddAsync(s, ct);
        else { e.FullName = s.FullName; e.ClassLevel = s.ClassLevel; e.DeviceUserId = s.DeviceUserId; }
    }
    public Task<int> SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
