using Coaching.Academic.Application;
using Coaching.Academic.Application.Features;
using Coaching.Academic.Domain;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Coaching.Academic.Infrastructure;

public sealed class AcademicStore(AcademicDbContext db) : IAcademicStore
{
    public async Task<IReadOnlyList<Subject>> ListSubjectsAsync(int? classLevel, CancellationToken ct = default)
    {
        var query = db.Subjects.AsNoTracking();
        if (classLevel is not null)
            query = query.Where(subject => subject.ClassLevel == classLevel);

        return await query
            .OrderBy(subject => subject.Name)
            .ThenBy(subject => subject.Code)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<AcademicBatch>> ListBatchesAsync(int? classLevel, CancellationToken ct = default)
    {
        var query = db.AcademicBatches.AsNoTracking();
        if (classLevel is not null)
            query = query.Where(batch => batch.ClassLevel == classLevel);

        return await query
            .OrderBy(batch => batch.Name)
            .ThenBy(batch => batch.Code)
            .ToListAsync(ct);
    }

    public Task<IReadOnlyDictionary<int, int>> CountSubjectsByClassLevelAsync(CancellationToken ct = default) =>
        CountByClassLevelAsync(db.Subjects, subject => subject.ClassLevel, ct);

    public Task<IReadOnlyDictionary<int, int>> CountBatchesByClassLevelAsync(CancellationToken ct = default) =>
        CountByClassLevelAsync(db.AcademicBatches, batch => batch.ClassLevel, ct);

    public Task<Subject?> FindSubjectByClassLevelAndNameAsync(int classLevel, string name, CancellationToken ct = default) =>
        db.Subjects.FirstOrDefaultAsync(
            subject => subject.ClassLevel == classLevel && subject.Name.ToUpper() == name.ToUpper(), ct);

    public Task<Subject?> FindSubjectByClassLevelAndCodeAsync(int classLevel, string code, CancellationToken ct = default) =>
        db.Subjects.FirstOrDefaultAsync(
            subject => subject.ClassLevel == classLevel && subject.Code == code, ct);

    public Task<AcademicBatch?> FindBatchByClassLevelAndNameAsync(int classLevel, string name, CancellationToken ct = default) =>
        db.AcademicBatches.FirstOrDefaultAsync(
            batch => batch.ClassLevel == classLevel && batch.Name.ToUpper() == name.ToUpper(), ct);

    public Task<AcademicBatch?> FindBatchByClassLevelAndCodeAsync(int classLevel, string code, CancellationToken ct = default) =>
        db.AcademicBatches.FirstOrDefaultAsync(
            batch => batch.ClassLevel == classLevel && batch.Code == code, ct);

    public async Task AddSubjectAsync(Subject subject, CancellationToken ct = default) =>
        await db.Subjects.AddAsync(subject, ct);

    public async Task AddBatchAsync(AcademicBatch batch, CancellationToken ct = default) =>
        await db.AcademicBatches.AddAsync(batch, ct);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        try
        {
            return await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: "23505" })
        {
            throw new AcademicConflictException(
                "academic",
                "A record with the same class and name or code already exists.");
        }
    }

    private static async Task<IReadOnlyDictionary<int, int>> CountByClassLevelAsync<T>(
        IQueryable<T> query,
        System.Linq.Expressions.Expression<Func<T, int>> classLevel,
        CancellationToken ct)
        where T : class
    {
        var counts = await query
            .GroupBy(classLevel)
            .Select(group => new { ClassLevel = group.Key, Count = group.Count() })
            .ToListAsync(ct);

        return counts.ToDictionary(item => item.ClassLevel, item => item.Count);
    }
}
