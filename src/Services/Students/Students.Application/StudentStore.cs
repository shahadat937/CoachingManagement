using Coaching.Students.Domain;

namespace Coaching.Students.Application;

/// <summary>
/// Persistence boundary for the Students workflow. It exposes the lookup operations
/// needed to keep student numbers and optional device identifiers unique.
/// </summary>
public interface IStudentStore
{
    Task<Student?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Student?> FindByStudentNoAsync(string studentNo, CancellationToken ct = default);
    Task<Student?> FindByDeviceUserIdAsync(string deviceUserId, CancellationToken ct = default);
    Task<IReadOnlyList<Student>> ListAsync(CancellationToken ct = default);
    Task AddAsync(Student student, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
