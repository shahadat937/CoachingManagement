using Coaching.BuildingBlocks.Contracts;
using Coaching.Students.Application;
using Coaching.Students.Application.Features;
using Coaching.Students.Domain;
using Xunit;

namespace Coaching.Students.Tests;

public class StudentCreationTests
{
    [Fact]
    public async Task Create_normalizes_values_persists_the_student_and_stages_the_event()
    {
        var store = new InMemoryStudentStore();
        var outbox = new RecordingStudentOutbox();
        var handler = new CreateStudentHandler(store, outbox);

        var created = await handler.Handle(new CreateStudentCommand(
            " st-2026-001 ",
            "  Amina Rahman  ",
            8,
            " +880 1712-345678 ",
            "   "), CancellationToken.None);

        Assert.Equal("ST-2026-001", created.StudentNo);
        Assert.Equal("Amina Rahman", created.FullName);
        Assert.Equal("+880 1712-345678", created.GuardianPhone);
        Assert.Null(created.DeviceUserId);
        Assert.Equal(created.Id, Assert.Single(store.Students).Id);

        var staged = Assert.Single(outbox.Events);
        Assert.Equal(created.Id, staged.StudentId);
        Assert.Equal("Amina Rahman", staged.FullName);
    }

    [Theory]
    [InlineData("", "Amina Rahman", 8, "+8801712345678", "studentNo")]
    [InlineData("ST-001", "", 8, "+8801712345678", "fullName")]
    [InlineData("ST-001", "Amina Rahman", 13, "+8801712345678", "classLevel")]
    [InlineData("ST-001", "Amina Rahman", 8, "phone", "guardianPhone")]
    public async Task Create_rejects_invalid_input(string studentNo, string fullName, int classLevel, string guardianPhone, string field)
    {
        var handler = new CreateStudentHandler(new InMemoryStudentStore(), new RecordingStudentOutbox());

        var exception = await Assert.ThrowsAsync<StudentInputException>(() => handler.Handle(
            new CreateStudentCommand(studentNo, fullName, classLevel, guardianPhone, null),
            CancellationToken.None));

        Assert.Equal(field, exception.Field);
    }

    [Fact]
    public async Task Create_rejects_a_student_number_that_already_exists_after_normalization()
    {
        var store = new InMemoryStudentStore
        {
            Students = [new Student { StudentNo = "ST-2026-001", FullName = "Existing Student", ClassLevel = 8, GuardianPhone = "+8801712345678" }],
        };
        var handler = new CreateStudentHandler(store, new RecordingStudentOutbox());

        var exception = await Assert.ThrowsAsync<StudentConflictException>(() => handler.Handle(
            new CreateStudentCommand(" st-2026-001 ", "Amina Rahman", 8, "+8801712345678", null),
            CancellationToken.None));

        Assert.Equal("studentNo", exception.Field);
    }

    [Fact]
    public async Task Create_rejects_an_assigned_device_user_id()
    {
        var store = new InMemoryStudentStore
        {
            Students = [new Student
            {
                StudentNo = "ST-2026-001",
                FullName = "Existing Student",
                ClassLevel = 8,
                GuardianPhone = "+8801712345678",
                DeviceUserId = "FINGERPRINT-08",
            }],
        };
        var handler = new CreateStudentHandler(store, new RecordingStudentOutbox());

        var exception = await Assert.ThrowsAsync<StudentConflictException>(() => handler.Handle(
            new CreateStudentCommand("ST-2026-002", "Amina Rahman", 8, "+8801712345678", "FINGERPRINT-08"),
            CancellationToken.None));

        Assert.Equal("deviceUserId", exception.Field);
    }

    private sealed class InMemoryStudentStore : IStudentStore
    {
        public List<Student> Students { get; init; } = [];

        public Task<Student?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(Students.SingleOrDefault(student => student.Id == id));

        public Task<Student?> FindByStudentNoAsync(string studentNo, CancellationToken ct = default) =>
            Task.FromResult(Students.SingleOrDefault(student => student.StudentNo == studentNo));

        public Task<Student?> FindByDeviceUserIdAsync(string deviceUserId, CancellationToken ct = default) =>
            Task.FromResult(Students.SingleOrDefault(student => student.DeviceUserId == deviceUserId));

        public Task<IReadOnlyList<Student>> ListAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<Student>>(Students);

        public Task AddAsync(Student student, CancellationToken ct = default)
        {
            Students.Add(student);
            return Task.CompletedTask;
        }

        public Task<int> SaveChangesAsync(CancellationToken ct = default) => Task.FromResult(1);
    }

    private sealed class RecordingStudentOutbox : IStudentEventOutbox
    {
        public List<StudentEnrolled> Events { get; } = [];

        public Task EnqueueAsync(StudentEnrolled @event, CancellationToken ct = default)
        {
            Events.Add(@event);
            return Task.CompletedTask;
        }
    }
}
