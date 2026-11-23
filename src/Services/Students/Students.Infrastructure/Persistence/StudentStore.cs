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

    public Task<Student?> FindByStudentNoAsync(string studentNo, CancellationToken ct = default) =>
        db.Students.AsNoTracking().FirstOrDefaultAsync(student => student.StudentNo == studentNo, ct);

    public Task<Student?> FindByDeviceUserIdAsync(string deviceUserId, CancellationToken ct = default) =>
        db.Students.AsNoTracking().FirstOrDefaultAsync(student => student.DeviceUserId == deviceUserId, ct);

    public async Task<IReadOnlyList<Student>> ListAsync(CancellationToken ct = default) =>
        await db.Students.AsNoTracking().OrderBy(student => student.FullName).ToListAsync(ct);

    public async Task AddAsync(Student student, CancellationToken ct = default) =>
        await db.Students.AddAsync(student, ct);

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
