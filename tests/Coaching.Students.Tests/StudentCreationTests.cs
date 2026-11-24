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
        Assert.True(created.IsActive);
        Assert.Null(created.DeactivatedAt);
        Assert.Equal(created.Id, Assert.Single(store.Students).Id);

        var staged = Assert.Single(outbox.Events);
        Assert.Equal(created.Id, staged.StudentId);
        Assert.Equal("Amina Rahman", staged.FullName);
        Assert.True(staged.IsActive);
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

    [Fact]
    public async Task Update_normalizes_values_preserves_photo_and_stages_the_student_sync_event()
    {
        var student = new Student
        {
            StudentNo = "ST-2026-001",
            FullName = "Old Name",
            ClassLevel = 7,
            GuardianPhone = "+8801712345678",
            DeviceUserId = "DEVICE-01",
        };
        var photoUpdatedAt = DateTimeOffset.UtcNow.AddDays(-1);
        var store = new InMemoryStudentStore { Students = [student] };
        store.Photos.Add(new StudentPhoto
        {
            StudentId = student.Id,
            Content = [0xFF, 0xD8, 0xFF],
            ContentType = "image/jpeg",
            SizeBytes = 3,
            UpdatedAt = photoUpdatedAt,
        });
        var outbox = new RecordingStudentOutbox();
        var handler = new UpdateStudentHandler(store, outbox);

        var updated = await handler.Handle(new UpdateStudentCommand(
            student.Id,
            " st-2026-001 ",
            "  Amina Rahman  ",
            8,
            " +880 1712-345678 ",
            " DEVICE-01 "), CancellationToken.None);

        Assert.NotNull(updated);
        Assert.Equal("ST-2026-001", updated.StudentNo);
        Assert.Equal("Amina Rahman", updated.FullName);
        Assert.Equal(8, updated.ClassLevel);
        Assert.Equal("+880 1712-345678", updated.GuardianPhone);
        Assert.Equal("DEVICE-01", updated.DeviceUserId);
        Assert.True(updated.HasPhoto);
        Assert.Equal(photoUpdatedAt, updated.PhotoUpdatedAt);
        Assert.Equal("Amina Rahman", student.FullName);
        Assert.Equal(8, student.ClassLevel);
        Assert.Equal([0xFF, 0xD8, 0xFF], Assert.Single(store.Photos).Content);
        Assert.Equal(1, store.SaveChangesCalls);

        var staged = Assert.Single(outbox.Events);
        Assert.Equal(student.Id, staged.StudentId);
        Assert.Equal("Amina Rahman", staged.FullName);
        Assert.Equal(8, staged.ClassLevel);
        Assert.Equal("DEVICE-01", staged.DeviceUserId);
        Assert.Equal("+880 1712-345678", staged.GuardianPhone);
        Assert.True(staged.IsActive);
    }

    [Fact]
    public async Task Deactivate_marks_the_record_inactive_preserves_data_and_stages_an_inactive_sync_event()
    {
        var student = new Student
        {
            StudentNo = "ST-2026-001",
            FullName = "Amina Rahman",
            ClassLevel = 8,
            GuardianPhone = "+8801712345678",
            DeviceUserId = "DEVICE-01",
        };
        var store = new InMemoryStudentStore { Students = [student] };
        store.Photos.Add(new StudentPhoto
        {
            StudentId = student.Id,
            Content = [0xFF, 0xD8, 0xFF],
            ContentType = "image/jpeg",
            SizeBytes = 3,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        var outbox = new RecordingStudentOutbox();
        var handler = new DeactivateStudentHandler(store, outbox);

        var result = await handler.Handle(new DeactivateStudentCommand(student.Id), CancellationToken.None);

        Assert.NotNull(result);
        Assert.True(result.WasDeactivated);
        Assert.False(student.IsActive);
        Assert.NotNull(student.DeactivatedAt);
        Assert.Equal("ST-2026-001", student.StudentNo);
        Assert.Equal("DEVICE-01", student.DeviceUserId);
        Assert.Single(store.Photos);
        Assert.Equal(1, store.SaveChangesCalls);
        Assert.Empty((await new ListStudentsHandler(store).Handle(new ListStudentsQuery(), CancellationToken.None)).Items);

        var staged = Assert.Single(outbox.Events);
        Assert.Equal(student.Id, staged.StudentId);
        Assert.Equal("DEVICE-01", staged.DeviceUserId);
        Assert.False(staged.IsActive);
    }

    [Fact]
    public async Task Deactivate_is_idempotent_for_an_inactive_student()
    {
        var deactivatedAt = DateTimeOffset.UtcNow.AddDays(-1);
        var student = new Student
        {
            StudentNo = "ST-2026-001",
            FullName = "Amina Rahman",
            ClassLevel = 8,
            GuardianPhone = "+8801712345678",
            IsActive = false,
            DeactivatedAt = deactivatedAt,
        };
        var store = new InMemoryStudentStore { Students = [student] };
        var outbox = new RecordingStudentOutbox();
        var handler = new DeactivateStudentHandler(store, outbox);

        var result = await handler.Handle(new DeactivateStudentCommand(student.Id), CancellationToken.None);

        Assert.NotNull(result);
        Assert.False(result.WasDeactivated);
        Assert.Equal(deactivatedAt, student.DeactivatedAt);
        Assert.Empty(outbox.Events);
        Assert.Equal(0, store.SaveChangesCalls);
    }

    [Fact]
    public async Task Deactivate_returns_null_for_an_unknown_student_without_changing_state()
    {
        var store = new InMemoryStudentStore();
        var outbox = new RecordingStudentOutbox();
        var handler = new DeactivateStudentHandler(store, outbox);

        var result = await handler.Handle(new DeactivateStudentCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.Null(result);
        Assert.Empty(outbox.Events);
        Assert.Equal(0, store.SaveChangesCalls);
    }

    [Fact]
    public async Task Activate_restores_an_inactive_record_and_stages_an_active_sync_event()
    {
        var deactivatedAt = DateTimeOffset.UtcNow.AddDays(-1);
        var student = new Student
        {
            StudentNo = "ST-2026-001",
            FullName = "Amina Rahman",
            ClassLevel = 8,
            GuardianPhone = "+8801712345678",
            DeviceUserId = "DEVICE-01",
            IsActive = false,
            DeactivatedAt = deactivatedAt,
        };
        var store = new InMemoryStudentStore { Students = [student] };
        store.Photos.Add(new StudentPhoto
        {
            StudentId = student.Id,
            Content = [0xFF, 0xD8, 0xFF],
            ContentType = "image/jpeg",
            SizeBytes = 3,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        var outbox = new RecordingStudentOutbox();
        var handler = new ActivateStudentHandler(store, outbox);

        var beforeActivation = await new ListStudentsHandler(store).Handle(new ListStudentsQuery(false), CancellationToken.None);
        var result = await handler.Handle(new ActivateStudentCommand(student.Id), CancellationToken.None);
        var activeStudents = await new ListStudentsHandler(store).Handle(new ListStudentsQuery(), CancellationToken.None);
        var inactiveStudents = await new ListStudentsHandler(store).Handle(new ListStudentsQuery(false), CancellationToken.None);

        Assert.Single(beforeActivation.Items);
        Assert.NotNull(result);
        Assert.True(result.WasActivated);
        Assert.True(student.IsActive);
        Assert.Null(student.DeactivatedAt);
        Assert.Equal("ST-2026-001", student.StudentNo);
        Assert.Equal("DEVICE-01", student.DeviceUserId);
        Assert.Single(store.Photos);
        Assert.Equal(1, store.SaveChangesCalls);
        Assert.Equal(student.Id, Assert.Single(activeStudents.Items).Id);
        Assert.Empty(inactiveStudents.Items);

        var staged = Assert.Single(outbox.Events);
        Assert.Equal(student.Id, staged.StudentId);
        Assert.Equal("DEVICE-01", staged.DeviceUserId);
        Assert.True(staged.IsActive);
    }

    [Fact]
    public async Task Activate_is_idempotent_for_an_active_student()
    {
        var student = new Student
        {
            StudentNo = "ST-2026-001",
            FullName = "Amina Rahman",
            ClassLevel = 8,
            GuardianPhone = "+8801712345678",
        };
        var store = new InMemoryStudentStore { Students = [student] };
        var outbox = new RecordingStudentOutbox();
        var handler = new ActivateStudentHandler(store, outbox);

        var result = await handler.Handle(new ActivateStudentCommand(student.Id), CancellationToken.None);

        Assert.NotNull(result);
        Assert.False(result.WasActivated);
        Assert.True(student.IsActive);
        Assert.Empty(outbox.Events);
        Assert.Equal(0, store.SaveChangesCalls);
    }

    [Fact]
    public async Task Activate_returns_null_for_an_unknown_student_without_changing_state()
    {
        var store = new InMemoryStudentStore();
        var outbox = new RecordingStudentOutbox();
        var handler = new ActivateStudentHandler(store, outbox);

        var result = await handler.Handle(new ActivateStudentCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.Null(result);
        Assert.Empty(outbox.Events);
        Assert.Equal(0, store.SaveChangesCalls);
    }

    [Fact]
    public async Task List_returns_a_stable_page_and_loads_photo_metadata_only_for_that_page()
    {
        var aminaSecond = new Student { StudentNo = "ST-002", FullName = "Amina Rahman", ClassLevel = 8, GuardianPhone = "+8801712345678" };
        var aminaFirst = new Student { StudentNo = "ST-001", FullName = "Amina Rahman", ClassLevel = 8, GuardianPhone = "+8801712345679" };
        var bill = new Student { StudentNo = "ST-003", FullName = "Bill Ahmed", ClassLevel = 8, GuardianPhone = "+8801712345680" };
        var inactive = new Student { StudentNo = "ST-004", FullName = "Inactive Learner", ClassLevel = 8, GuardianPhone = "+8801712345681", IsActive = false };
        var store = new InMemoryStudentStore { Students = [bill, inactive, aminaSecond, aminaFirst] };
        store.Photos.Add(new StudentPhoto
        {
            StudentId = bill.Id,
            Content = [0xFF, 0xD8, 0xFF],
            ContentType = "image/jpeg",
            SizeBytes = 3,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        var handler = new ListStudentsHandler(store);

        var firstPage = await handler.Handle(new ListStudentsQuery(IsActive: true, Page: 1, PageSize: 2), CancellationToken.None);
        var page = await handler.Handle(new ListStudentsQuery(IsActive: true, Page: 2, PageSize: 2), CancellationToken.None);

        Assert.Equal([aminaFirst.Id, aminaSecond.Id], firstPage.Items.Select(item => item.Id));
        Assert.Equal(3, page.TotalCount);
        Assert.Equal(2, page.Page);
        Assert.Equal(2, page.PageSize);
        Assert.Equal(2, page.TotalPages);
        var item = Assert.Single(page.Items);
        Assert.Equal(bill.Id, item.Id);
        Assert.True(item.HasPhoto);
        Assert.Equal([bill.Id], store.LastPhotoMetadataStudentIds);

        var clampedPage = await handler.Handle(new ListStudentsQuery(IsActive: true, Page: 99, PageSize: 2), CancellationToken.None);
        var inactivePage = await handler.Handle(new ListStudentsQuery(IsActive: false, Page: 1, PageSize: 2), CancellationToken.None);

        Assert.Equal(2, clampedPage.Page);
        Assert.Equal(bill.Id, Assert.Single(clampedPage.Items).Id);
        Assert.Equal(1, inactivePage.TotalCount);
        Assert.Equal(inactive.Id, Assert.Single(inactivePage.Items).Id);
    }

    [Fact]
    public async Task List_clamps_an_empty_result_set_to_the_first_page()
    {
        var result = await new ListStudentsHandler(new InMemoryStudentStore()).Handle(
            new ListStudentsQuery(IsActive: true, Page: 25, PageSize: 10),
            CancellationToken.None);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(1, result.TotalPages);
    }

    [Theory]
    [InlineData(0, 10, "page")]
    [InlineData(1, 0, "pageSize")]
    [InlineData(1, 101, "pageSize")]
    public async Task List_rejects_invalid_paging_input(int page, int pageSize, string field)
    {
        var handler = new ListStudentsHandler(new InMemoryStudentStore());

        var exception = await Assert.ThrowsAsync<StudentInputException>(() => handler.Handle(
            new ListStudentsQuery(IsActive: true, Page: page, PageSize: pageSize),
            CancellationToken.None));

        Assert.Equal(field, exception.Field);
    }

    [Theory]
    [InlineData("studentNo")]
    [InlineData("deviceUserId")]
    public async Task Update_rejects_unique_values_assigned_to_another_student(string field)
    {
        var student = new Student
        {
            StudentNo = "ST-2026-001",
            FullName = "Amina Rahman",
            ClassLevel = 8,
            GuardianPhone = "+8801712345678",
            DeviceUserId = "DEVICE-01",
        };
        var otherStudent = new Student
        {
            StudentNo = "ST-2026-002",
            FullName = "Other Student",
            ClassLevel = 8,
            GuardianPhone = "+8801812345678",
            DeviceUserId = "DEVICE-02",
        };
        var store = new InMemoryStudentStore { Students = [student, otherStudent] };
        var outbox = new RecordingStudentOutbox();
        var handler = new UpdateStudentHandler(store, outbox);
        var command = field == "studentNo"
            ? new UpdateStudentCommand(student.Id, otherStudent.StudentNo, student.FullName, student.ClassLevel, student.GuardianPhone, student.DeviceUserId)
            : new UpdateStudentCommand(student.Id, student.StudentNo, student.FullName, student.ClassLevel, student.GuardianPhone, otherStudent.DeviceUserId);

        var exception = await Assert.ThrowsAsync<StudentConflictException>(() => handler.Handle(command, CancellationToken.None));

        Assert.Equal(field, exception.Field);
        Assert.Empty(outbox.Events);
        Assert.Equal(0, store.SaveChangesCalls);
    }

    [Fact]
    public async Task Update_returns_null_for_an_unknown_student_without_staging_an_event()
    {
        var store = new InMemoryStudentStore();
        var outbox = new RecordingStudentOutbox();
        var handler = new UpdateStudentHandler(store, outbox);

        var updated = await handler.Handle(new UpdateStudentCommand(
            Guid.NewGuid(),
            "ST-2026-001",
            "Amina Rahman",
            8,
            "+8801712345678",
            null), CancellationToken.None);

        Assert.Null(updated);
        Assert.Empty(outbox.Events);
        Assert.Equal(0, store.SaveChangesCalls);
    }

    private sealed class InMemoryStudentStore : IStudentStore
    {
        public List<Student> Students { get; init; } = [];
        public List<StudentPhoto> Photos { get; } = [];
        public IReadOnlyList<Guid> LastPhotoMetadataStudentIds { get; private set; } = [];
        public int SaveChangesCalls { get; private set; }

        public Task<Student?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(Students.SingleOrDefault(student => student.Id == id));

        public Task<Student?> GetByIdForUpdateAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(Students.SingleOrDefault(student => student.Id == id));

        public Task<Student?> FindByStudentNoAsync(string studentNo, CancellationToken ct = default) =>
            Task.FromResult(Students.SingleOrDefault(student => student.StudentNo == studentNo));

        public Task<Student?> FindByDeviceUserIdAsync(string deviceUserId, CancellationToken ct = default) =>
            Task.FromResult(Students.SingleOrDefault(student => student.DeviceUserId == deviceUserId));

        public Task<int> CountAsync(bool isActive, CancellationToken ct = default) =>
            Task.FromResult(Students.Count(student => student.IsActive == isActive));

        public Task<IReadOnlyList<Student>> ListPageAsync(bool isActive, int skip, int take, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<Student>>(Students
                .Where(student => student.IsActive == isActive)
                .OrderBy(student => student.FullName)
                .ThenBy(student => student.StudentNo)
                .ThenBy(student => student.Id)
                .Skip(skip)
                .Take(take)
                .ToList());

        public Task<IReadOnlyDictionary<Guid, StudentPhotoMetadata>> ListPhotoMetadataAsync(
            IReadOnlyCollection<Guid> studentIds,
            CancellationToken ct = default)
        {
            LastPhotoMetadataStudentIds = studentIds.Order().ToArray();
            return Task.FromResult<IReadOnlyDictionary<Guid, StudentPhotoMetadata>>(Photos
                .Where(photo => studentIds.Contains(photo.StudentId))
                .ToDictionary(
                    photo => photo.StudentId,
                    photo => new StudentPhotoMetadata(photo.ContentType, photo.SizeBytes, photo.UpdatedAt)));
        }

        public Task<StudentPhotoMetadata?> GetPhotoMetadataAsync(Guid studentId, CancellationToken ct = default)
        {
            var photo = Photos.SingleOrDefault(candidate => candidate.StudentId == studentId);
            return Task.FromResult(photo is null
                ? null
                : new StudentPhotoMetadata(photo.ContentType, photo.SizeBytes, photo.UpdatedAt));
        }

        public Task<StudentPhoto?> GetPhotoAsync(Guid studentId, CancellationToken ct = default) =>
            Task.FromResult(Photos.SingleOrDefault(photo => photo.StudentId == studentId));

        public Task<StudentPhoto?> GetPhotoForUpdateAsync(Guid studentId, CancellationToken ct = default) =>
            Task.FromResult(Photos.SingleOrDefault(photo => photo.StudentId == studentId));

        public Task AddAsync(Student student, CancellationToken ct = default)
        {
            Students.Add(student);
            return Task.CompletedTask;
        }

        public Task AddPhotoAsync(StudentPhoto photo, CancellationToken ct = default)
        {
            Photos.Add(photo);
            return Task.CompletedTask;
        }

        public Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            SaveChangesCalls++;
            return Task.FromResult(1);
        }
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
