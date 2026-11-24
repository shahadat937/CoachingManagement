using Coaching.BuildingBlocks;

namespace Coaching.Academic.Domain;

/// <summary>
/// A recurring weekly teaching period for one academic batch.
/// DayOfWeek uses 1 for Monday through 7 for Sunday.
/// </summary>
public class BatchRoutineSlot : Entity
{
    public Guid BatchId { get; private set; }
    public Guid SubjectId { get; private set; }
    public int DayOfWeek { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public string RoomCode { get; private set; } = default!;

    private BatchRoutineSlot() { }

    public BatchRoutineSlot(
        Guid batchId,
        Guid subjectId,
        int dayOfWeek,
        TimeOnly startTime,
        TimeOnly endTime,
        string roomCode)
    {
        SetValues(batchId, subjectId, dayOfWeek, startTime, endTime, roomCode);
    }

    public void Update(
        Guid batchId,
        Guid subjectId,
        int dayOfWeek,
        TimeOnly startTime,
        TimeOnly endTime,
        string roomCode) =>
        SetValues(batchId, subjectId, dayOfWeek, startTime, endTime, roomCode);

    private void SetValues(
        Guid batchId,
        Guid subjectId,
        int dayOfWeek,
        TimeOnly startTime,
        TimeOnly endTime,
        string roomCode)
    {
        if (batchId == Guid.Empty) throw new ArgumentException("Batch is required.", nameof(batchId));
        if (subjectId == Guid.Empty) throw new ArgumentException("Subject is required.", nameof(subjectId));
        if (dayOfWeek is < 1 or > 7) throw new ArgumentOutOfRangeException(nameof(dayOfWeek), "Day must be between Monday (1) and Sunday (7).");
        if (endTime <= startTime) throw new ArgumentException("Routine end time must be after the start time.", nameof(endTime));
        if (string.IsNullOrWhiteSpace(roomCode)) throw new ArgumentException("Room is required.", nameof(roomCode));

        BatchId = batchId;
        SubjectId = subjectId;
        DayOfWeek = dayOfWeek;
        StartTime = startTime;
        EndTime = endTime;
        RoomCode = roomCode;
    }
}
