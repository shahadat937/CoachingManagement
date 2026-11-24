using Coaching.Attendance.Application;
using Coaching.Attendance.Application.Features;
using Coaching.Attendance.Domain;
using Coaching.BuildingBlocks;
using Coaching.BuildingBlocks.Contracts;
using Xunit;

namespace Coaching.Attendance.Tests;

public class AttendanceFlowTests
{
    private static readonly DateTimeOffset SessionStart = new(2026, 11, 23, 9, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Class_session_applies_the_documented_punch_and_late_boundaries()
    {
        var session = CreateSession();

        Assert.True(session.AcceptsPunchAt(SessionStart.AddMinutes(-15)));
        Assert.False(session.AcceptsPunchAt(SessionStart.AddMinutes(-15).AddTicks(-1)));
        Assert.True(session.AcceptsPunchAt(SessionStart.AddHours(1)));
        Assert.False(session.AcceptsPunchAt(SessionStart.AddHours(1).AddTicks(1)));
        Assert.Equal(AttendanceStatus.Present, session.StatusFor(SessionStart.AddMinutes(10)));
        Assert.Equal(AttendanceStatus.Late, session.StatusFor(SessionStart.AddMinutes(10).AddTicks(1)));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(13)]
    public void Class_session_rejects_invalid_class_levels(int classLevel)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new ClassSession(
            classLevel,
            Guid.NewGuid(),
            "Mathematics",
            "A-101",
            SessionStart,
            SessionStart.AddHours(1)));
    }

    [Fact]
    public async Task Device_punch_marks_once_and_publishes_an_attendance_event()
    {
        var studentId = Guid.NewGuid();
        var store = new InMemoryAttendanceStore
        {
            Session = CreateSession(),
            Student = new StudentRef
            {
                StudentId = studentId,
                FullName = "Amina Rahman",
                ClassLevel = 8,
                DeviceUserId = "device-user-8",
            },
        };
        var bus = new RecordingEventBus();
        var handler = new RecordDevicePunchHandler(store, bus);
        var command = new RecordDevicePunchCommand("device-user-8", "A-101", SessionStart.AddMinutes(5), "DEV-01");

        var accepted = await handler.Handle(command, CancellationToken.None);
        var duplicate = await handler.Handle(command, CancellationToken.None);

        Assert.True(accepted);
        Assert.False(duplicate);

        var record = Assert.Single(store.Records);
        Assert.Equal(studentId, record.StudentId);
        Assert.Equal(store.Session!.Id, record.SessionId);
        Assert.Equal(AttendanceStatus.Present, record.Status);
        Assert.Equal(AttendanceSource.Device, record.Source);

        var published = Assert.IsType<AttendanceMarked>(Assert.Single(bus.Events));
        Assert.Equal(record.SessionId, published.SessionId);
        Assert.Equal(record.StudentId, published.StudentId);
        Assert.Equal("Present", published.Status);
    }

    [Fact]
    public async Task Device_punch_is_ignored_when_the_student_projection_is_missing()
    {
        var store = new InMemoryAttendanceStore { Session = CreateSession() };
        var bus = new RecordingEventBus();
        var handler = new RecordDevicePunchHandler(store, bus);

        var accepted = await handler.Handle(
            new RecordDevicePunchCommand("unknown-user", "A-101", SessionStart, "DEV-01"),
            CancellationToken.None);

        Assert.False(accepted);
        Assert.Empty(store.Records);
        Assert.Empty(bus.Events);
    }

    [Fact]
    public async Task Device_punch_is_ignored_when_the_student_projection_is_inactive()
    {
        var store = new InMemoryAttendanceStore
        {
            Session = CreateSession(),
            Student = new StudentRef
            {
                StudentId = Guid.NewGuid(),
                FullName = "Inactive Learner",
                ClassLevel = 8,
                DeviceUserId = "inactive-device-user",
                IsActive = false,
            },
        };
        var bus = new RecordingEventBus();
        var handler = new RecordDevicePunchHandler(store, bus);

        var accepted = await handler.Handle(
            new RecordDevicePunchCommand("inactive-device-user", "A-101", SessionStart, "DEV-01"),
            CancellationToken.None);

        Assert.False(accepted);
        Assert.Empty(store.Records);
        Assert.Empty(bus.Events);
    }

    [Fact]
    public async Task Student_sync_preserves_inactive_status_in_the_local_projection()
    {
        var store = new InMemoryAttendanceStore();
        var handler = new UpsertStudentRefHandler(store);
        var studentId = Guid.NewGuid();

        await handler.Handle(
            new UpsertStudentRefCommand(studentId, "Inactive Learner", 8, "inactive-device-user", IsActive: false),
            CancellationToken.None);

        var student = Assert.IsType<StudentRef>(store.Student);
        Assert.Equal(studentId, student.StudentId);
        Assert.False(student.IsActive);
    }

    private static ClassSession CreateSession() => new(
        classLevel: 8,
        subjectId: Guid.NewGuid(),
        subjectName: "Mathematics",
        roomCode: "A-101",
        startsAt: SessionStart,
        endsAt: SessionStart.AddHours(1));

    private sealed class InMemoryAttendanceStore : IAttendanceStore
    {
        private readonly List<AttendanceRecord> _records = [];

        public ClassSession? Session { get; init; }
        public StudentRef? Student { get; set; }
        public IReadOnlyList<AttendanceRecord> Records => _records;

        public Task<ClassSession?> GetSessionAsync(Guid id, CancellationToken ct) =>
            Task.FromResult(Session?.Id == id ? Session : null);

        public Task<ClassSession?> FindOpenSessionAsync(int classLevel, string roomCode, DateTimeOffset at, CancellationToken ct) =>
            Task.FromResult(Session is { } session
                            && session.ClassLevel == classLevel
                            && session.RoomCode == roomCode
                            && session.AcceptsPunchAt(at)
                ? session
                : null);

        public Task AddSessionAsync(ClassSession session, CancellationToken ct) => Task.CompletedTask;

        public Task<AttendanceRecord?> GetRecordAsync(Guid sessionId, Guid studentId, CancellationToken ct) =>
            Task.FromResult(_records.FirstOrDefault(record => record.SessionId == sessionId && record.StudentId == studentId));

        public Task AddRecordAsync(AttendanceRecord record, CancellationToken ct)
        {
            _records.Add(record);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<AttendanceRecord>> ListRecordsAsync(Guid sessionId, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AttendanceRecord>>(_records.Where(record => record.SessionId == sessionId).ToList());

        public Task<StudentRef?> FindStudentByDeviceUserIdAsync(string deviceUserId, CancellationToken ct) =>
            Task.FromResult(Student?.DeviceUserId == deviceUserId ? Student : null);

        public Task UpsertStudentAsync(StudentRef student, CancellationToken ct)
        {
            Student = student;
            return Task.CompletedTask;
        }

        public Task<int> SaveChangesAsync(CancellationToken ct) => Task.FromResult(1);
    }

    private sealed class RecordingEventBus : IEventBus
    {
        public List<object> Events { get; } = [];

        public Task PublishAsync<T>(T @event, CancellationToken ct = default) where T : class
        {
            Events.Add(@event);
            return Task.CompletedTask;
        }
    }
}
