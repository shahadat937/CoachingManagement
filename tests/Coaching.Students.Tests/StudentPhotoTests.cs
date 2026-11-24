using Coaching.Students.Application;
using Coaching.Students.Application.Features;
using Coaching.Students.Domain;
using Xunit;

namespace Coaching.Students.Tests;

public class StudentPhotoValidationTests
{
    [Theory]
    [MemberData(nameof(ValidImages))]
    public void Validate_accepts_supported_photo_signatures(string declaredContentType, byte[] content, string expectedContentType)
    {
        var upload = StudentPhotoUploadValidation.Validate(declaredContentType, content);

        Assert.Equal(expectedContentType, upload.ContentType);
        Assert.Same(content, upload.Content);
    }

    [Fact]
    public void Validate_rejects_a_declared_mime_type_that_does_not_match_the_image_bytes()
    {
        var exception = Assert.Throws<StudentPhotoValidationException>(() =>
            StudentPhotoUploadValidation.Validate("image/png", Jpeg));

        Assert.Contains("does not match", exception.Message);
    }

    [Fact]
    public void Validate_rejects_unsupported_or_non_image_content()
    {
        Assert.Throws<StudentPhotoValidationException>(() =>
            StudentPhotoUploadValidation.Validate("image/gif", [0x47, 0x49, 0x46, 0x38]));
    }

    [Fact]
    public void Validate_rejects_a_photo_over_the_size_limit()
    {
        var tooLarge = new byte[StudentPhotoUploadValidation.MaxPhotoBytes + 1];
        tooLarge[0] = 0xFF;
        tooLarge[1] = 0xD8;
        tooLarge[2] = 0xFF;

        Assert.Throws<StudentPhotoSizeLimitExceededException>(() =>
            StudentPhotoUploadValidation.Validate("image/jpeg", tooLarge));
    }

    public static IEnumerable<object[]> ValidImages =>
    [
        ["image/jpeg", Jpeg, "image/jpeg"],
        ["image/png; charset=binary", Png, "image/png"],
        ["image/webp", Webp, "image/webp"],
    ];

    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0];
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] Webp = [
        (byte)'R', (byte)'I', (byte)'F', (byte)'F', 0x00, 0x00, 0x00, 0x00,
        (byte)'W', (byte)'E', (byte)'B', (byte)'P',
    ];
}

public class StudentPhotoHandlerTests
{
    [Fact]
    public async Task Upload_replaces_a_private_photo_and_student_rows_report_photo_metadata()
    {
        var student = new Student
        {
            StudentNo = "ST-2026-100",
            FullName = "Amina Rahman",
            ClassLevel = 8,
            GuardianPhone = "+8801712345678",
        };
        var store = new InMemoryPhotoStudentStore(student);
        var upload = new UploadStudentPhotoHandler(store);

        var firstUpload = await upload.Handle(
            new UploadStudentPhotoCommand(student.Id, "image/jpeg", [0xFF, 0xD8, 0xFF]),
            CancellationToken.None);
        var metadata = await upload.Handle(
            new UploadStudentPhotoCommand(student.Id, "image/png", [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
            CancellationToken.None);

        Assert.NotNull(firstUpload);
        Assert.NotNull(metadata);
        Assert.Equal("image/png", metadata.ContentType);
        Assert.Equal(8, metadata.SizeBytes);
        Assert.Single(store.Photos);
        Assert.Equal("image/png", store.Photos[0].ContentType);

        var studentRow = Assert.Single(await new ListStudentsHandler(store).Handle(new ListStudentsQuery(), CancellationToken.None));
        Assert.True(studentRow.HasPhoto);
        Assert.Equal(metadata.UpdatedAt, studentRow.PhotoUpdatedAt);

        var fetched = await new GetStudentPhotoHandler(store).Handle(new GetStudentPhotoQuery(student.Id), CancellationToken.None);
        Assert.NotNull(fetched);
        Assert.Equal("image/png", fetched.Metadata.ContentType);
        Assert.Equal([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], fetched.Bytes);
    }

    [Fact]
    public async Task Upload_returns_null_for_an_unknown_student_so_the_api_can_return_not_found()
    {
        var result = await new UploadStudentPhotoHandler(new InMemoryPhotoStudentStore()).Handle(
            new UploadStudentPhotoCommand(Guid.NewGuid(), "image/png", [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
            CancellationToken.None);

        Assert.Null(result);
    }

    private sealed class InMemoryPhotoStudentStore(params Student[] seededStudents) : IStudentStore
    {
        private readonly List<Student> students = [.. seededStudents];
        public List<StudentPhoto> Photos { get; } = [];

        public Task<Student?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(students.SingleOrDefault(student => student.Id == id));

        public Task<Student?> GetByIdForUpdateAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(students.SingleOrDefault(student => student.Id == id));

        public Task<Student?> FindByStudentNoAsync(string studentNo, CancellationToken ct = default) =>
            Task.FromResult(students.SingleOrDefault(student => student.StudentNo == studentNo));

        public Task<Student?> FindByDeviceUserIdAsync(string deviceUserId, CancellationToken ct = default) =>
            Task.FromResult(students.SingleOrDefault(student => student.DeviceUserId == deviceUserId));

        public Task<IReadOnlyList<Student>> ListAsync(bool isActive, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<Student>>(students.Where(student => student.IsActive == isActive).ToList());

        public Task<IReadOnlyDictionary<Guid, StudentPhotoMetadata>> ListPhotoMetadataAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyDictionary<Guid, StudentPhotoMetadata>>(Photos.ToDictionary(
                photo => photo.StudentId,
                photo => new StudentPhotoMetadata(photo.ContentType, photo.SizeBytes, photo.UpdatedAt)));

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
            students.Add(student);
            return Task.CompletedTask;
        }

        public Task AddPhotoAsync(StudentPhoto photo, CancellationToken ct = default)
        {
            Photos.Add(photo);
            return Task.CompletedTask;
        }

        public Task<int> SaveChangesAsync(CancellationToken ct = default) => Task.FromResult(1);
    }
}
