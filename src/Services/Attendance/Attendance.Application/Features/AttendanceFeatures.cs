using Coaching.Attendance.Domain;
using Coaching.BuildingBlocks;
using Coaching.BuildingBlocks.Contracts;
using FluentValidation;
using MediatR;

namespace Coaching.Attendance.Application.Features;

// ---- Create session ----
public record CreateSessionCommand(int ClassLevel, Guid SubjectId, string SubjectName, string RoomCode,
    DateTimeOffset StartsAt, DateTimeOffset EndsAt) : IRequest<Guid>;

public class CreateSessionValidator : AbstractValidator<CreateSessionCommand>
{
    public CreateSessionValidator()
    {
        RuleFor(x => x.ClassLevel).InclusiveBetween(1, 12);
        RuleFor(x => x.RoomCode).NotEmpty();
        RuleFor(x => x.EndsAt).GreaterThan(x => x.StartsAt);
    }
}

public class CreateSessionHandler(IAttendanceStore store) : IRequestHandler<CreateSessionCommand, Guid>
{
    public async Task<Guid> Handle(CreateSessionCommand c, CancellationToken ct)
    {
        var s = new ClassSession(c.ClassLevel, c.SubjectId, c.SubjectName, c.RoomCode, c.StartsAt, c.EndsAt);
        await store.AddSessionAsync(s, ct);
        await store.SaveChangesAsync(ct);
        return s.Id;
    }
}

// ---- Manual mark / correction by teacher ----
public record MarkAttendanceCommand(Guid SessionId, Guid StudentId, AttendanceStatus Status) : IRequest;

public class MarkAttendanceHandler(IAttendanceStore store) : IRequestHandler<MarkAttendanceCommand>
{
    public async Task Handle(MarkAttendanceCommand c, CancellationToken ct)
    {
        _ = await store.GetSessionAsync(c.SessionId, ct) ?? throw new KeyNotFoundException("Session not found");
        var existing = await store.GetRecordAsync(c.SessionId, c.StudentId, ct);
        if (existing is null)
            await store.AddRecordAsync(new AttendanceRecord(c.SessionId, c.StudentId, c.Status, AttendanceSource.Manual, DateTimeOffset.UtcNow), ct);
        else
            existing.Change(c.Status, AttendanceSource.Manual);
        await store.SaveChangesAsync(ct);
    }
}

// ---- Device punch -> subject-wise attendance ----
public record RecordDevicePunchCommand(string DeviceUserId, string RoomCode, DateTimeOffset PunchedAt, string DeviceSerial) : IRequest<bool>;

public class RecordDevicePunchHandler(IAttendanceStore store, IEventBus bus) : IRequestHandler<RecordDevicePunchCommand, bool>
{
    public async Task<bool> Handle(RecordDevicePunchCommand c, CancellationToken ct)
    {
        var student = await store.FindStudentByDeviceUserIdAsync(c.DeviceUserId, ct);
        if (student is null || !student.IsActive) return false;               // unknown or inactive card/finger

        // The punch's room + time + the student's class decide WHICH SUBJECT session this belongs to.
        var session = await store.FindOpenSessionAsync(student.ClassLevel, c.RoomCode, c.PunchedAt, ct);
        if (session is null || !session.AcceptsPunchAt(c.PunchedAt)) return false;

        if (await store.GetRecordAsync(session.Id, student.StudentId, ct) is not null) return false; // first punch wins

        var status = session.StatusFor(c.PunchedAt);
        await store.AddRecordAsync(new AttendanceRecord(session.Id, student.StudentId, status, AttendanceSource.Device, c.PunchedAt, c.DeviceSerial), ct);
        await store.SaveChangesAsync(ct);
        await bus.PublishAsync(new AttendanceMarked(session.Id, student.StudentId, status.ToString(), c.PunchedAt), ct); // -> notifications to guardians
        return true;
    }
}

// ---- Student read-model sync ----
public record UpsertStudentRefCommand(
    Guid StudentId,
    string FullName,
    int ClassLevel,
    string? DeviceUserId,
    bool IsActive = true) : IRequest;

public class UpsertStudentRefHandler(IAttendanceStore store) : IRequestHandler<UpsertStudentRefCommand>
{
    public async Task Handle(UpsertStudentRefCommand c, CancellationToken ct)
    {
        await store.UpsertStudentAsync(new StudentRef
        {
            StudentId = c.StudentId,
            FullName = c.FullName,
            ClassLevel = c.ClassLevel,
            DeviceUserId = c.DeviceUserId,
            IsActive = c.IsActive,
        }, ct);
        await store.SaveChangesAsync(ct);
    }
}

// ---- Query ----
public record AttendanceRow(Guid StudentId, string Status, string Source, DateTimeOffset MarkedAt);
public record GetSessionAttendanceQuery(Guid SessionId) : IRequest<IReadOnlyList<AttendanceRow>>;

public class GetSessionAttendanceHandler(IAttendanceStore store) : IRequestHandler<GetSessionAttendanceQuery, IReadOnlyList<AttendanceRow>>
{
    public async Task<IReadOnlyList<AttendanceRow>> Handle(GetSessionAttendanceQuery q, CancellationToken ct) =>
        (await store.ListRecordsAsync(q.SessionId, ct))
            .Select(r => new AttendanceRow(r.StudentId, r.Status.ToString(), r.Source.ToString(), r.MarkedAt)).ToList();
}
