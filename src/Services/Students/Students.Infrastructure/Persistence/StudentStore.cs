using Coaching.Students.Application;
using Coaching.Students.Application.Features;
using Coaching.Students.Domain;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Coaching.Students.Infrastructure.Persistence;

public sealed class StudentStore(StudentsDbContext db) : IStudentStore
{
    public Task<Student?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Students.AsNoTracking().FirstOrDefaultAsync(student => student.Id == id, ct);

    public Task<Student?> GetByIdForUpdateAsync(Guid id, CancellationToken ct = default) =>
        db.Students.FirstOrDefaultAsync(student => student.Id == id, ct);

    public Task<Student?> FindByStudentNoAsync(string studentNo, CancellationToken ct = default) =>
        db.Students.AsNoTracking().FirstOrDefaultAsync(student => student.StudentNo == studentNo, ct);

    public Task<Student?> FindByDeviceUserIdAsync(string deviceUserId, CancellationToken ct = default) =>
        db.Students.AsNoTracking().FirstOrDefaultAsync(student => student.DeviceUserId == deviceUserId, ct);

    public Task<int> CountAsync(bool isActive, CancellationToken ct = default) =>
        db.Students.CountAsync(student => student.IsActive == isActive, ct);

    public async Task<IReadOnlyList<Student>> ListPageAsync(bool isActive, int skip, int take, CancellationToken ct = default) =>
        await db.Students
            .AsNoTracking()
            .Where(student => student.IsActive == isActive)
            .OrderBy(student => student.FullName)
            .ThenBy(student => student.StudentNo)
            .ThenBy(student => student.Id)
            .Skip(skip)
            .Take(take)
            .ToListAsync(ct);

    public async Task<IReadOnlyDictionary<Guid, StudentPhotoMetadata>> ListPhotoMetadataAsync(
        IReadOnlyCollection<Guid> studentIds,
        CancellationToken ct = default)
    {
        if (studentIds.Count == 0)
            return new Dictionary<Guid, StudentPhotoMetadata>();

        var ids = studentIds.Distinct().ToArray();
        var photos = await db.StudentPhotos
            .AsNoTracking()
            .Where(photo => ids.Contains(photo.StudentId))
            .Select(photo => new { photo.StudentId, photo.ContentType, photo.UpdatedAt, photo.SizeBytes })
            .ToListAsync(ct);

        return photos.ToDictionary(
            photo => photo.StudentId,
            photo => new StudentPhotoMetadata(photo.ContentType, photo.SizeBytes, photo.UpdatedAt));
    }

    public Task<StudentPhotoMetadata?> GetPhotoMetadataAsync(Guid studentId, CancellationToken ct = default) =>
        db.StudentPhotos
            .AsNoTracking()
            .Where(photo => photo.StudentId == studentId)
            .Select(photo => new StudentPhotoMetadata(photo.ContentType, photo.SizeBytes, photo.UpdatedAt))
            .FirstOrDefaultAsync(ct);

    public Task<StudentPhoto?> GetPhotoAsync(Guid studentId, CancellationToken ct = default) =>
        db.StudentPhotos.AsNoTracking().FirstOrDefaultAsync(photo => photo.StudentId == studentId, ct);

    public Task<StudentPhoto?> GetPhotoForUpdateAsync(Guid studentId, CancellationToken ct = default) =>
        db.StudentPhotos.FirstOrDefaultAsync(photo => photo.StudentId == studentId, ct);

    public async Task AddAsync(Student student, CancellationToken ct = default) =>
        await db.Students.AddAsync(student, ct);

    public async Task AddPhotoAsync(StudentPhoto photo, CancellationToken ct = default) =>
        await db.StudentPhotos.AddAsync(photo, ct);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        try
        {
            return await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: "23505" })
        {
            throw new StudentConflictException(
                "student",
                "A student with the same student number or device user ID already exists.",
                exception);
        }
    }
}
