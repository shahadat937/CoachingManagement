using Coaching.BuildingBlocks.Contracts;
using Coaching.Students.Domain;
using MediatR;

namespace Coaching.Students.Application.Features;

public sealed record StudentResponse(
    Guid Id,
    DateTimeOffset CreatedAt,
    string StudentNo,
    string FullName,
    int ClassLevel,
    string GuardianPhone,
    string? DeviceUserId,
    bool HasPhoto,
    DateTimeOffset? PhotoUpdatedAt)
{
    public static StudentResponse From(Student student, StudentPhotoMetadata? photo = null) => new(
        student.Id,
        student.CreatedAt,
        student.StudentNo,
        student.FullName,
        student.ClassLevel,
        student.GuardianPhone,
        student.DeviceUserId,
        photo is not null,
        photo?.UpdatedAt);
}

public sealed class StudentInputException(string field, string message) : Exception(message)
{
    public string Field { get; } = field;
}

public class StudentConflictException : Exception
{
    public StudentConflictException(string field, string message) : base(message) => Field = field;
    public StudentConflictException(string field, string message, Exception innerException) : base(message, innerException) => Field = field;

    public string Field { get; }
}

public record ListStudentsQuery : IRequest<IReadOnlyList<StudentResponse>>;

public class ListStudentsHandler(IStudentStore store) : IRequestHandler<ListStudentsQuery, IReadOnlyList<StudentResponse>>
{
    public async Task<IReadOnlyList<StudentResponse>> Handle(ListStudentsQuery query, CancellationToken ct)
    {
        var students = await store.ListAsync(ct);
        var photos = await store.ListPhotoMetadataAsync(ct);
        return students.Select(student =>
        {
            photos.TryGetValue(student.Id, out var photo);
            return StudentResponse.From(student, photo);
        }).ToList();
    }
}

public record GetStudentQuery(Guid Id) : IRequest<StudentResponse?>;

public class GetStudentHandler(IStudentStore store) : IRequestHandler<GetStudentQuery, StudentResponse?>
{
    public async Task<StudentResponse?> Handle(GetStudentQuery query, CancellationToken ct)
    {
        var student = await store.GetByIdAsync(query.Id, ct);
        if (student is null)
            return null;

        return StudentResponse.From(student, await store.GetPhotoMetadataAsync(query.Id, ct));
    }
}

public record UploadStudentPhotoCommand(Guid StudentId, string? DeclaredContentType, byte[] Content) : IRequest<StudentPhotoMetadata?>;

public class UploadStudentPhotoHandler(IStudentStore store) : IRequestHandler<UploadStudentPhotoCommand, StudentPhotoMetadata?>
{
    public async Task<StudentPhotoMetadata?> Handle(UploadStudentPhotoCommand command, CancellationToken ct)
    {
        var upload = StudentPhotoUploadValidation.Validate(command.DeclaredContentType, command.Content);
        if (await store.GetByIdAsync(command.StudentId, ct) is null)
            return null;

        var now = DateTimeOffset.UtcNow;
        var photo = await store.GetPhotoForUpdateAsync(command.StudentId, ct);
        if (photo is null)
        {
            photo = new StudentPhoto
            {
                StudentId = command.StudentId,
                Content = upload.Content,
                ContentType = upload.ContentType,
                SizeBytes = upload.Content.LongLength,
                UpdatedAt = now,
            };
            await store.AddPhotoAsync(photo, ct);
        }
        else
        {
            photo.Content = upload.Content;
            photo.ContentType = upload.ContentType;
            photo.SizeBytes = upload.Content.LongLength;
            photo.UpdatedAt = now;
        }

        await store.SaveChangesAsync(ct);
        return new StudentPhotoMetadata(photo.ContentType, photo.SizeBytes, photo.UpdatedAt);
    }
}

public record GetStudentPhotoQuery(Guid StudentId) : IRequest<StudentPhotoContent?>;

public class GetStudentPhotoHandler(IStudentStore store) : IRequestHandler<GetStudentPhotoQuery, StudentPhotoContent?>
{
    public async Task<StudentPhotoContent?> Handle(GetStudentPhotoQuery query, CancellationToken ct)
    {
        var photo = await store.GetPhotoAsync(query.StudentId, ct);
        return photo is null
            ? null
            : new StudentPhotoContent(
                photo.Content,
                new StudentPhotoMetadata(photo.ContentType, photo.SizeBytes, photo.UpdatedAt));
    }
}

public record CreateStudentCommand(
    string? StudentNo,
    string? FullName,
    int ClassLevel,
    string? GuardianPhone,
    string? DeviceUserId) : IRequest<StudentResponse>;

public class CreateStudentHandler(IStudentStore store, IStudentEventOutbox outbox) : IRequestHandler<CreateStudentCommand, StudentResponse>
{
    public async Task<StudentResponse> Handle(CreateStudentCommand command, CancellationToken ct)
    {
        var input = StudentInputValidation.Validate(
            command.StudentNo,
            command.FullName,
            command.ClassLevel,
            command.GuardianPhone,
            command.DeviceUserId);

        if (await store.FindByStudentNoAsync(input.StudentNo, ct) is not null)
            throw new StudentConflictException("studentNo", "A student with this student number already exists.");

        if (input.DeviceUserId is not null && await store.FindByDeviceUserIdAsync(input.DeviceUserId, ct) is not null)
            throw new StudentConflictException("deviceUserId", "This device user ID is already assigned to another student.");

        var student = new Student
        {
            StudentNo = input.StudentNo,
            FullName = input.FullName,
            ClassLevel = input.ClassLevel,
            GuardianPhone = input.GuardianPhone,
            DeviceUserId = input.DeviceUserId,
        };

        await store.AddAsync(student, ct);
        await outbox.EnqueueAsync(new StudentEnrolled(
            student.Id,
            student.FullName,
            student.ClassLevel,
            student.DeviceUserId,
            student.GuardianPhone), ct);
        await store.SaveChangesAsync(ct);
        return StudentResponse.From(student);
    }
}

public record UpdateStudentCommand(
    Guid Id,
    string? StudentNo,
    string? FullName,
    int ClassLevel,
    string? GuardianPhone,
    string? DeviceUserId) : IRequest<StudentResponse?>;

public class UpdateStudentHandler(IStudentStore store, IStudentEventOutbox outbox) : IRequestHandler<UpdateStudentCommand, StudentResponse?>
{
    public async Task<StudentResponse?> Handle(UpdateStudentCommand command, CancellationToken ct)
    {
        var input = StudentInputValidation.Validate(
            command.StudentNo,
            command.FullName,
            command.ClassLevel,
            command.GuardianPhone,
            command.DeviceUserId);

        var student = await store.GetByIdForUpdateAsync(command.Id, ct);
        if (student is null)
            return null;

        var studentNoOwner = await store.FindByStudentNoAsync(input.StudentNo, ct);
        if (studentNoOwner is not null && studentNoOwner.Id != student.Id)
            throw new StudentConflictException("studentNo", "A student with this student number already exists.");

        if (input.DeviceUserId is not null)
        {
            var deviceUserIdOwner = await store.FindByDeviceUserIdAsync(input.DeviceUserId, ct);
            if (deviceUserIdOwner is not null && deviceUserIdOwner.Id != student.Id)
            {
                throw new StudentConflictException("deviceUserId", "This device user ID is already assigned to another student.");
            }
        }

        student.StudentNo = input.StudentNo;
        student.FullName = input.FullName;
        student.ClassLevel = input.ClassLevel;
        student.GuardianPhone = input.GuardianPhone;
        student.DeviceUserId = input.DeviceUserId;

        await outbox.EnqueueAsync(new StudentEnrolled(
            student.Id,
            student.FullName,
            student.ClassLevel,
            student.DeviceUserId,
            student.GuardianPhone), ct);
        await store.SaveChangesAsync(ct);

        return StudentResponse.From(student, await store.GetPhotoMetadataAsync(student.Id, ct));
    }
}

internal sealed record ValidatedStudentInput(
    string StudentNo,
    string FullName,
    int ClassLevel,
    string GuardianPhone,
    string? DeviceUserId);

internal static class StudentInputValidation
{
    public static ValidatedStudentInput Validate(
        string? studentNo,
        string? fullName,
        int classLevel,
        string? guardianPhone,
        string? deviceUserId)
    {
        var normalizedStudentNo = NormalizeStudentNo(studentNo);
        var normalizedFullName = NormalizeRequired(fullName, "fullName", "Full name", 256);
        var normalizedGuardianPhone = NormalizeGuardianPhone(guardianPhone);
        var normalizedDeviceUserId = NormalizeOptional(deviceUserId, "deviceUserId", "Device user ID", 128);

        if (classLevel is < 1 or > 12)
            throw new StudentInputException("classLevel", "Class level must be between 1 and 12.");

        return new ValidatedStudentInput(
            normalizedStudentNo,
            normalizedFullName,
            classLevel,
            normalizedGuardianPhone,
            normalizedDeviceUserId);
    }

    private static string NormalizeStudentNo(string? value) =>
        NormalizeRequired(value, "studentNo", "Student number", 64).ToUpperInvariant();

    private static string NormalizeGuardianPhone(string? value)
    {
        var phone = NormalizeRequired(value, "guardianPhone", "Guardian phone", 64);
        if (phone.Count(char.IsDigit) < 6 || phone.Any(character =>
                !char.IsDigit(character) && character is not '+' and not '-' and not ' ' and not '(' and not ')'))
        {
            throw new StudentInputException("guardianPhone", "Enter a valid guardian phone number.");
        }

        return phone;
    }

    private static string NormalizeRequired(string? value, string field, string displayName, int maximumLength)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
            throw new StudentInputException(field, $"{displayName} is required.");

        if (normalized.Length > maximumLength)
            throw new StudentInputException(field, $"{displayName} must be {maximumLength} characters or fewer.");

        return normalized;
    }

    private static string? NormalizeOptional(string? value, string field, string displayName, int maximumLength)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
            return null;

        if (normalized.Length > maximumLength)
            throw new StudentInputException(field, $"{displayName} must be {maximumLength} characters or fewer.");

        return normalized;
    }
}
