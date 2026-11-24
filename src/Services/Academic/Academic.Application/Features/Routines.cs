using Coaching.Academic.Domain;
using MediatR;

namespace Coaching.Academic.Application.Features;

public sealed record BatchRoutineSlotResponse(
    Guid Id,
    Guid BatchId,
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    int DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string RoomCode,
    string? TeacherName)
{
    public static BatchRoutineSlotResponse From(BatchRoutineSlot slot, Subject subject) => new(
        slot.Id,
        slot.BatchId,
        slot.SubjectId,
        subject.Name,
        subject.Code,
        slot.DayOfWeek,
        slot.StartTime,
        slot.EndTime,
        slot.RoomCode,
        slot.TeacherName);
}

public sealed class AcademicNotFoundException(string message) : Exception(message);

public sealed record ListBatchRoutineQuery(Guid BatchId) : IRequest<IReadOnlyList<BatchRoutineSlotResponse>>;

public sealed class ListBatchRoutineHandler(IAcademicStore store)
    : IRequestHandler<ListBatchRoutineQuery, IReadOnlyList<BatchRoutineSlotResponse>>
{
    public async Task<IReadOnlyList<BatchRoutineSlotResponse>> Handle(ListBatchRoutineQuery query, CancellationToken ct)
    {
        var batch = await RoutineContext.GetRequiredBatchAsync(store, query.BatchId, ct);
        var subjects = (await store.ListSubjectsAsync(batch.ClassLevel, ct))
            .ToDictionary(subject => subject.Id);
        var slots = await store.ListRoutineSlotsAsync(batch.Id, ct);

        return slots.Select(slot =>
        {
            if (!subjects.TryGetValue(slot.SubjectId, out var subject))
                throw new AcademicNotFoundException("A routine subject could not be found.");
            return BatchRoutineSlotResponse.From(slot, subject);
        }).ToArray();
    }
}

public sealed record CreateBatchRoutineCommand(
    Guid BatchId,
    Guid SubjectId,
    int DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? RoomCode,
    string? TeacherName = null) : IRequest<BatchRoutineSlotResponse>;

public sealed class CreateBatchRoutineHandler(IAcademicStore store)
    : IRequestHandler<CreateBatchRoutineCommand, BatchRoutineSlotResponse>
{
    public async Task<BatchRoutineSlotResponse> Handle(CreateBatchRoutineCommand command, CancellationToken ct)
    {
        var input = RoutineInput.Validate(
            command.BatchId,
            command.SubjectId,
            command.DayOfWeek,
            command.StartTime,
            command.EndTime,
            command.RoomCode,
            command.TeacherName);
        var context = await RoutineContext.ResolveAsync(store, input.BatchId, input.SubjectId, ct);
        await RoutineContext.EnsureNoOverlapAsync(store, input, null, ct);

        var slot = new BatchRoutineSlot(
            input.BatchId,
            input.SubjectId,
            input.DayOfWeek,
            input.StartTime,
            input.EndTime,
            input.RoomCode,
            input.TeacherName);
        await store.AddRoutineSlotAsync(slot, ct);
        await store.SaveChangesAsync(ct);
        return BatchRoutineSlotResponse.From(slot, context.Subject);
    }
}

public sealed record UpdateBatchRoutineCommand(
    Guid Id,
    Guid BatchId,
    Guid SubjectId,
    int DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? RoomCode,
    string? TeacherName = null) : IRequest<BatchRoutineSlotResponse>;

public sealed class UpdateBatchRoutineHandler(IAcademicStore store)
    : IRequestHandler<UpdateBatchRoutineCommand, BatchRoutineSlotResponse>
{
    public async Task<BatchRoutineSlotResponse> Handle(UpdateBatchRoutineCommand command, CancellationToken ct)
    {
        if (command.Id == Guid.Empty)
            throw new AcademicInputException("id", "Routine id is required.");

        var slot = await store.FindRoutineSlotByIdAsync(command.Id, ct)
            ?? throw new AcademicNotFoundException("Routine entry was not found.");
        var input = RoutineInput.Validate(
            command.BatchId,
            command.SubjectId,
            command.DayOfWeek,
            command.StartTime,
            command.EndTime,
            command.RoomCode,
            command.TeacherName);
        var context = await RoutineContext.ResolveAsync(store, input.BatchId, input.SubjectId, ct);
        await RoutineContext.EnsureNoOverlapAsync(store, input, slot.Id, ct);

        slot.Update(
            input.BatchId,
            input.SubjectId,
            input.DayOfWeek,
            input.StartTime,
            input.EndTime,
            input.RoomCode,
            input.TeacherName);
        await store.SaveChangesAsync(ct);
        return BatchRoutineSlotResponse.From(slot, context.Subject);
    }
}

public sealed record DeleteBatchRoutineCommand(Guid Id) : IRequest;

public sealed class DeleteBatchRoutineHandler(IAcademicStore store)
    : IRequestHandler<DeleteBatchRoutineCommand>
{
    public async Task Handle(DeleteBatchRoutineCommand command, CancellationToken ct)
    {
        if (command.Id == Guid.Empty)
            throw new AcademicInputException("id", "Routine id is required.");

        var slot = await store.FindRoutineSlotByIdAsync(command.Id, ct)
            ?? throw new AcademicNotFoundException("Routine entry was not found.");
        store.RemoveRoutineSlot(slot);
        await store.SaveChangesAsync(ct);
    }
}

public sealed record ValidatedRoutineInput(
    Guid BatchId,
    Guid SubjectId,
    int DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string RoomCode,
    string? TeacherName);

internal sealed record RoutineContext(AcademicBatch Batch, Subject Subject)
{
    public static async Task<AcademicBatch> GetRequiredBatchAsync(
        IAcademicStore store,
        Guid batchId,
        CancellationToken ct)
    {
        if (batchId == Guid.Empty)
            throw new AcademicInputException("batchId", "Batch is required.");

        return await store.FindBatchByIdAsync(batchId, ct)
            ?? throw new AcademicNotFoundException("Batch was not found.");
    }

    public static async Task<RoutineContext> ResolveAsync(
        IAcademicStore store,
        Guid batchId,
        Guid subjectId,
        CancellationToken ct)
    {
        var batch = await GetRequiredBatchAsync(store, batchId, ct);
        var subject = await store.FindSubjectByIdAsync(subjectId, ct)
            ?? throw new AcademicNotFoundException("Subject was not found.");

        if (subject.ClassLevel != batch.ClassLevel)
            throw new AcademicInputException("subjectId", "The subject must belong to the selected batch's class.");

        return new RoutineContext(batch, subject);
    }

    public static async Task EnsureNoOverlapAsync(
        IAcademicStore store,
        ValidatedRoutineInput input,
        Guid? excludingSlotId,
        CancellationToken ct)
    {
        if (await store.HasRoutineOverlapAsync(
                input.BatchId,
                input.DayOfWeek,
                input.StartTime,
                input.EndTime,
                excludingSlotId,
                ct))
        {
            throw new AcademicConflictException(
                "routine",
                "This routine time overlaps another lesson for the selected batch.");
        }
    }
}

internal static class RoutineInput
{
    public static ValidatedRoutineInput Validate(
        Guid batchId,
        Guid subjectId,
        int dayOfWeek,
        TimeOnly startTime,
        TimeOnly endTime,
        string? roomCode,
        string? teacherName = null)
    {
        if (batchId == Guid.Empty)
            throw new AcademicInputException("batchId", "Batch is required.");
        if (subjectId == Guid.Empty)
            throw new AcademicInputException("subjectId", "Subject is required.");
        if (dayOfWeek is < 1 or > 7)
            throw new AcademicInputException("dayOfWeek", "Day must be between Monday (1) and Sunday (7).");
        if (endTime <= startTime)
            throw new AcademicInputException("endTime", "End time must be after start time.");

        var normalizedRoom = CollapseWhitespace(roomCode);
        if (string.IsNullOrEmpty(normalizedRoom))
            throw new AcademicInputException("roomCode", "Room is required.");
        if (normalizedRoom.Length > 60)
            throw new AcademicInputException("roomCode", "Room must be 60 characters or fewer.");

        var normalizedTeacherName = CollapseWhitespace(teacherName);
        if (normalizedTeacherName is { Length: > 100 })
            throw new AcademicInputException("teacherName", "Teacher name must be 100 characters or fewer.");

        return new ValidatedRoutineInput(
            batchId,
            subjectId,
            dayOfWeek,
            startTime,
            endTime,
            normalizedRoom,
            normalizedTeacherName);
    }

    private static string? CollapseWhitespace(string? value)
    {
        var parts = value?.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        return parts is { Length: > 0 } ? string.Join(' ', parts) : null;
    }
}
