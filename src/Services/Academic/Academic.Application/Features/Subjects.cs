using Coaching.Academic.Domain;
using MediatR;

namespace Coaching.Academic.Application.Features;

public sealed record AcademicClassResponse(int ClassLevel, int SubjectCount, int BatchCount);

public sealed record SubjectResponse(Guid Id, string Name, string Code, int ClassLevel)
{
    public static SubjectResponse From(Subject subject) => new(subject.Id, subject.Name, subject.Code, subject.ClassLevel);
}

public sealed record AcademicBatchResponse(Guid Id, string Name, string? Code, int ClassLevel)
{
    public static AcademicBatchResponse From(AcademicBatch batch) => new(batch.Id, batch.Name, batch.Code, batch.ClassLevel);
}

public sealed class AcademicInputException(string field, string message) : Exception(message)
{
    public string Field { get; } = field;
}

public sealed class AcademicConflictException(string field, string message) : Exception(message)
{
    public string Field { get; } = field;
}

public sealed record ListAcademicClassesQuery : IRequest<IReadOnlyList<AcademicClassResponse>>;

public sealed class ListAcademicClassesHandler(IAcademicStore store)
    : IRequestHandler<ListAcademicClassesQuery, IReadOnlyList<AcademicClassResponse>>
{
    public async Task<IReadOnlyList<AcademicClassResponse>> Handle(ListAcademicClassesQuery query, CancellationToken ct)
    {
        var subjectCounts = await store.CountSubjectsByClassLevelAsync(ct);
        var batchCounts = await store.CountBatchesByClassLevelAsync(ct);

        return Enumerable.Range(1, 12)
            .Select(classLevel => new AcademicClassResponse(
                classLevel,
                subjectCounts.GetValueOrDefault(classLevel),
                batchCounts.GetValueOrDefault(classLevel)))
            .ToArray();
    }
}

public sealed record ListSubjectsQuery(int? ClassLevel = null) : IRequest<IReadOnlyList<SubjectResponse>>;

public sealed class ListSubjectsHandler(IAcademicStore store)
    : IRequestHandler<ListSubjectsQuery, IReadOnlyList<SubjectResponse>>
{
    public async Task<IReadOnlyList<SubjectResponse>> Handle(ListSubjectsQuery query, CancellationToken ct)
    {
        AcademicInput.ValidateClassLevel(query.ClassLevel);
        var subjects = await store.ListSubjectsAsync(query.ClassLevel, ct);
        return subjects.Select(SubjectResponse.From).ToArray();
    }
}

public sealed record CreateSubjectCommand(int ClassLevel, string? Name, string? Code) : IRequest<SubjectResponse>;

public sealed class CreateSubjectHandler(IAcademicStore store) : IRequestHandler<CreateSubjectCommand, SubjectResponse>
{
    public async Task<SubjectResponse> Handle(CreateSubjectCommand command, CancellationToken ct)
    {
        var input = AcademicInput.ValidateSubject(command.ClassLevel, command.Name, command.Code);
        if (await store.FindSubjectByClassLevelAndCodeAsync(input.ClassLevel, input.Code, ct) is not null)
            throw new AcademicConflictException("code", "A subject with this code already exists for the selected class.");
        if (await store.FindSubjectByClassLevelAndNameAsync(input.ClassLevel, input.Name, ct) is not null)
            throw new AcademicConflictException("name", "A subject with this name already exists for the selected class.");

        var subject = new Subject { ClassLevel = input.ClassLevel, Name = input.Name, Code = input.Code };
        await store.AddSubjectAsync(subject, ct);
        await store.SaveChangesAsync(ct);
        return SubjectResponse.From(subject);
    }
}

public sealed record ListBatchesQuery(int? ClassLevel = null) : IRequest<IReadOnlyList<AcademicBatchResponse>>;

public sealed class ListBatchesHandler(IAcademicStore store)
    : IRequestHandler<ListBatchesQuery, IReadOnlyList<AcademicBatchResponse>>
{
    public async Task<IReadOnlyList<AcademicBatchResponse>> Handle(ListBatchesQuery query, CancellationToken ct)
    {
        AcademicInput.ValidateClassLevel(query.ClassLevel);
        var batches = await store.ListBatchesAsync(query.ClassLevel, ct);
        return batches.Select(AcademicBatchResponse.From).ToArray();
    }
}

public sealed record CreateBatchCommand(int ClassLevel, string? Name, string? Code) : IRequest<AcademicBatchResponse>;

public sealed class CreateBatchHandler(IAcademicStore store) : IRequestHandler<CreateBatchCommand, AcademicBatchResponse>
{
    public async Task<AcademicBatchResponse> Handle(CreateBatchCommand command, CancellationToken ct)
    {
        var input = AcademicInput.ValidateBatch(command.ClassLevel, command.Name, command.Code);
        if (await store.FindBatchByClassLevelAndNameAsync(input.ClassLevel, input.Name, ct) is not null)
            throw new AcademicConflictException("name", "A batch with this name already exists for the selected class.");
        if (input.Code is not null && await store.FindBatchByClassLevelAndCodeAsync(input.ClassLevel, input.Code, ct) is not null)
            throw new AcademicConflictException("code", "A batch with this code already exists for the selected class.");

        var batch = new AcademicBatch { ClassLevel = input.ClassLevel, Name = input.Name, Code = input.Code };
        await store.AddBatchAsync(batch, ct);
        await store.SaveChangesAsync(ct);
        return AcademicBatchResponse.From(batch);
    }
}

public sealed record ValidatedSubjectInput(int ClassLevel, string Name, string Code);
public sealed record ValidatedBatchInput(int ClassLevel, string Name, string? Code);

public static class AcademicInput
{
    public static void ValidateClassLevel(int? classLevel)
    {
        if (classLevel is not null && (classLevel < 1 || classLevel > 12))
            throw new AcademicInputException("classLevel", "Class level must be between 1 and 12.");
    }

    public static ValidatedSubjectInput ValidateSubject(int classLevel, string? name, string? code) => new(
        ValidateRequiredClassLevel(classLevel),
        NormalizeRequired(name, "name", "Subject name", 120),
        NormalizeCode(code, "code", "Subject code", required: true)!);

    public static ValidatedBatchInput ValidateBatch(int classLevel, string? name, string? code) => new(
        ValidateRequiredClassLevel(classLevel),
        NormalizeRequired(name, "name", "Batch name", 100),
        NormalizeCode(code, "code", "Batch code", required: false));

    private static int ValidateRequiredClassLevel(int classLevel)
    {
        ValidateClassLevel(classLevel);
        return classLevel;
    }

    private static string NormalizeRequired(string? value, string field, string displayName, int maximumLength)
    {
        var normalized = CollapseWhitespace(value);
        if (string.IsNullOrEmpty(normalized))
            throw new AcademicInputException(field, $"{displayName} is required.");
        if (normalized.Length > maximumLength)
            throw new AcademicInputException(field, $"{displayName} must be {maximumLength} characters or fewer.");
        return normalized;
    }

    private static string? NormalizeCode(string? value, string field, string displayName, bool required)
    {
        var normalized = CollapseWhitespace(value)?.ToUpperInvariant();
        if (string.IsNullOrEmpty(normalized))
        {
            if (required)
                throw new AcademicInputException(field, $"{displayName} is required.");
            return null;
        }

        if (normalized.Length > 32)
            throw new AcademicInputException(field, $"{displayName} must be 32 characters or fewer.");
        if (!normalized.All(character => char.IsAsciiLetterOrDigit(character) || character is '-' or '_'))
            throw new AcademicInputException(field, $"{displayName} can use only letters, numbers, hyphens, and underscores.");

        return normalized;
    }

    private static string? CollapseWhitespace(string? value)
    {
        var parts = value?.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        return parts is { Length: > 0 } ? string.Join(' ', parts) : null;
    }
}
