using Coaching.Academic.Domain;

namespace Coaching.Academic.Application;

/// <summary>
/// Query and persistence boundary for class-scoped academic setup data.
/// </summary>
public interface IAcademicStore
{
    Task<IReadOnlyList<Subject>> ListSubjectsAsync(int? classLevel, CancellationToken ct = default);
    Task<IReadOnlyList<AcademicBatch>> ListBatchesAsync(int? classLevel, CancellationToken ct = default);
    Task<IReadOnlyDictionary<int, int>> CountSubjectsByClassLevelAsync(CancellationToken ct = default);
    Task<IReadOnlyDictionary<int, int>> CountBatchesByClassLevelAsync(CancellationToken ct = default);
    Task<Subject?> FindSubjectByClassLevelAndNameAsync(int classLevel, string name, CancellationToken ct = default);
    Task<Subject?> FindSubjectByClassLevelAndCodeAsync(int classLevel, string code, CancellationToken ct = default);
    Task<AcademicBatch?> FindBatchByClassLevelAndNameAsync(int classLevel, string name, CancellationToken ct = default);
    Task<AcademicBatch?> FindBatchByClassLevelAndCodeAsync(int classLevel, string code, CancellationToken ct = default);
    Task<Subject?> FindSubjectByIdAsync(Guid id, CancellationToken ct = default);
    Task<AcademicBatch?> FindBatchByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<BatchRoutineSlot>> ListRoutineSlotsAsync(Guid batchId, CancellationToken ct = default);
    Task<BatchRoutineSlot?> FindRoutineSlotByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> HasRoutineOverlapAsync(
        Guid batchId,
        int dayOfWeek,
        TimeOnly startTime,
        TimeOnly endTime,
        Guid? excludingSlotId = null,
        CancellationToken ct = default);
    Task AddSubjectAsync(Subject subject, CancellationToken ct = default);
    Task AddBatchAsync(AcademicBatch batch, CancellationToken ct = default);
    Task AddRoutineSlotAsync(BatchRoutineSlot slot, CancellationToken ct = default);
    void RemoveRoutineSlot(BatchRoutineSlot slot);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
