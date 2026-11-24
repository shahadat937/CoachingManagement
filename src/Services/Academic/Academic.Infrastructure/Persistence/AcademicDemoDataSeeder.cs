using Coaching.Academic.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Coaching.Academic.Infrastructure;

/// <summary>
/// Adds predictable, local-only academic setup records for exercising the class,
/// subject, batch, and weekly routine screens. Existing records are never changed or duplicated.
/// </summary>
public static class AcademicDemoDataSeeder
{
    public const string SectionName = "AcademicDemoData";

    public static async Task SeedAsync(
        this IServiceProvider services,
        IHostEnvironment environment,
        IConfiguration configuration,
        CancellationToken ct = default)
    {
        if (!environment.IsDevelopment() || !configuration.GetValue<bool>($"{SectionName}:Enabled"))
            return;

        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger("AcademicDemoDataSeeder");
        var demoData = AcademicDemoDataGenerator.Create();

        var existingSubjects = await db.Subjects
            .AsNoTracking()
            .Select(subject => new AcademicRecordKey(subject.ClassLevel, subject.Name, subject.Code))
            .ToListAsync(ct);
        var existingBatches = await db.AcademicBatches
            .AsNoTracking()
            .Select(batch => new AcademicRecordKey(batch.ClassLevel, batch.Name, batch.Code))
            .ToListAsync(ct);

        var subjectNames = existingSubjects
            .Select(item => NameKey(item.ClassLevel, item.Name))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var subjectCodes = existingSubjects
            .Where(item => item.Code is not null)
            .Select(item => CodeKey(item.ClassLevel, item.Code!))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var batchNames = existingBatches
            .Select(item => NameKey(item.ClassLevel, item.Name))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var batchCodes = existingBatches
            .Where(item => item.Code is not null)
            .Select(item => CodeKey(item.ClassLevel, item.Code!))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var subjectsToAdd = demoData.Subjects
            .Where(item => !subjectNames.Contains(NameKey(item.ClassLevel, item.Name))
                && !subjectCodes.Contains(CodeKey(item.ClassLevel, item.Code)))
            .Select(item => new Subject
            {
                ClassLevel = item.ClassLevel,
                Name = item.Name,
                Code = item.Code,
            })
            .ToArray();
        var batchesToAdd = demoData.Batches
            .Where(item => !batchNames.Contains(NameKey(item.ClassLevel, item.Name))
                && !batchCodes.Contains(CodeKey(item.ClassLevel, item.Code)))
            .Select(item => new AcademicBatch
            {
                ClassLevel = item.ClassLevel,
                Name = item.Name,
                Code = item.Code,
            })
            .ToArray();

        if (subjectsToAdd.Length > 0)
            await db.Subjects.AddRangeAsync(subjectsToAdd, ct);
        if (batchesToAdd.Length > 0)
            await db.AcademicBatches.AddRangeAsync(batchesToAdd, ct);
        if (subjectsToAdd.Length > 0 || batchesToAdd.Length > 0)
            await db.SaveChangesAsync(ct);

        var subjectIds = (await db.Subjects
                .AsNoTracking()
                .Where(subject => demoData.SubjectCodes.Contains(subject.Code))
                .Select(subject => new DemoSubjectReference(subject.Id, subject.ClassLevel, subject.Code))
                .ToListAsync(ct))
            .ToDictionary(item => CodeKey(item.ClassLevel, item.Code), item => item.Id, StringComparer.OrdinalIgnoreCase);
        var batchIds = (await db.AcademicBatches
                .AsNoTracking()
                .Where(batch => batch.Code != null && demoData.BatchCodes.Contains(batch.Code))
                .Select(batch => new DemoBatchReference(batch.Id, batch.ClassLevel, batch.Code!))
                .ToListAsync(ct))
            .ToDictionary(item => CodeKey(item.ClassLevel, item.Code), item => item.Id, StringComparer.OrdinalIgnoreCase);
        var existingDemoRoutineSlots = await db.BatchRoutineSlots
            .Where(slot => batchIds.Values.Contains(slot.BatchId))
            .ToListAsync(ct);
        var existingRoutineKeys = existingDemoRoutineSlots
            .Select(slot => new RoutineSlotKey(slot.BatchId, slot.DayOfWeek, slot.StartTime))
            .ToHashSet();
        var demoRoutineEntries = demoData.Routines
            .Select(item => new
            {
                Item = item,
                BatchId = batchIds.GetValueOrDefault(CodeKey(item.ClassLevel, item.BatchCode)),
                SubjectId = subjectIds.GetValueOrDefault(CodeKey(item.ClassLevel, item.SubjectCode)),
            })
            .Where(item => item.BatchId != Guid.Empty && item.SubjectId != Guid.Empty)
            .ToArray();
        var expectedRoutineEntries = demoRoutineEntries
            .ToDictionary(
                item => new RoutineSlotKey(item.BatchId, item.Item.DayOfWeek, item.Item.StartTime),
                item => item);
        var routinesToAdd = demoRoutineEntries
            .Where(item => !existingRoutineKeys.Contains(new RoutineSlotKey(
                item.BatchId,
                item.Item.DayOfWeek,
                item.Item.StartTime)))
            .Select(item => new BatchRoutineSlot(
                item.BatchId,
                item.SubjectId,
                item.Item.DayOfWeek,
                item.Item.StartTime,
                item.Item.EndTime,
                item.Item.RoomCode,
                item.Item.TeacherName))
            .ToArray();

        var teacherNamesUpdated = 0;
        foreach (var slot in existingDemoRoutineSlots)
        {
            if (!string.IsNullOrWhiteSpace(slot.TeacherName)
                || !expectedRoutineEntries.TryGetValue(
                    new RoutineSlotKey(slot.BatchId, slot.DayOfWeek, slot.StartTime),
                    out var expected)
                || slot.SubjectId != expected.SubjectId
                || slot.EndTime != expected.Item.EndTime
                || !string.Equals(slot.RoomCode, expected.Item.RoomCode, StringComparison.Ordinal))
            {
                continue;
            }

            slot.Update(
                slot.BatchId,
                slot.SubjectId,
                slot.DayOfWeek,
                slot.StartTime,
                slot.EndTime,
                slot.RoomCode,
                expected.Item.TeacherName);
            teacherNamesUpdated++;
        }

        if (routinesToAdd.Length > 0)
            await db.BatchRoutineSlots.AddRangeAsync(routinesToAdd, ct);
        if (routinesToAdd.Length > 0 || teacherNamesUpdated > 0)
            await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "Academic demo data ready: {SubjectsInserted} subjects, {BatchesInserted} batches, {RoutinesInserted} routine slots inserted, and {TeacherNamesUpdated} teacher names updated.",
            subjectsToAdd.Length,
            batchesToAdd.Length,
            routinesToAdd.Length,
            teacherNamesUpdated);
    }

    private static string NameKey(int classLevel, string name) => $"{classLevel}\u001F{name.Trim()}";

    private static string CodeKey(int classLevel, string code) => $"{classLevel}\u001F{code.Trim()}";

    private sealed record AcademicRecordKey(int ClassLevel, string Name, string? Code);
    private sealed record DemoSubjectReference(Guid Id, int ClassLevel, string Code);
    private sealed record DemoBatchReference(Guid Id, int ClassLevel, string Code);
    private sealed record RoutineSlotKey(Guid BatchId, int DayOfWeek, TimeOnly StartTime);
}

internal sealed record DemoAcademicSubjectData(int ClassLevel, string Name, string Code);
internal sealed record DemoAcademicBatchData(int ClassLevel, string Name, string Code);
internal sealed record DemoAcademicRoutineData(
    int ClassLevel,
    string BatchCode,
    string SubjectCode,
    int DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string RoomCode,
    string TeacherName);
internal sealed record DemoAcademicData(
    IReadOnlyList<DemoAcademicSubjectData> Subjects,
    IReadOnlyList<DemoAcademicBatchData> Batches,
    IReadOnlyList<DemoAcademicRoutineData> Routines)
{
    public IReadOnlyCollection<string> SubjectCodes => Subjects.Select(subject => subject.Code).ToHashSet(StringComparer.OrdinalIgnoreCase);
    public IReadOnlyCollection<string> BatchCodes => Batches.Select(batch => batch.Code).ToHashSet(StringComparer.OrdinalIgnoreCase);
}

internal static class AcademicDemoDataGenerator
{
    internal const int ClassCount = 12;
    internal const int SubjectsPerClass = 6;
    internal const int BatchesPerClass = 3;
    internal const int RoutineSlotsPerBatch = 15;

    private static readonly (string Name, string Code)[] SubjectTemplates =
    [
        ("Bangla", "BAN"),
        ("English", "ENG"),
        ("Mathematics", "MAT"),
        ("Science", "SCI"),
        ("Information and Communication Technology", "ICT"),
        ("Social Science", "SOC"),
    ];

    private static readonly (string Name, string Code)[] BatchTemplates =
    [
        ("Morning Batch", "MOR"),
        ("Day Batch", "DAY"),
        ("Evening Batch", "EVE"),
    ];

    private static readonly IReadOnlyDictionary<string, string> TeachersBySubjectCode =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["BAN"] = "Nusrat Jahan",
            ["ENG"] = "Amina Rahman",
            ["MAT"] = "Farhan Ahmed",
            ["SCI"] = "Rafi Hossain",
            ["ICT"] = "Maliha Akter",
            ["SOC"] = "Sadia Islam",
        };

    private static readonly (int DayOfWeek, string SubjectCode, TimeOnly StartTime, TimeOnly EndTime)[] RoutineTemplates =
    [
        (1, "BAN", new TimeOnly(9, 0), new TimeOnly(9, 50)),
        (1, "ENG", new TimeOnly(10, 0), new TimeOnly(10, 50)),
        (1, "MAT", new TimeOnly(11, 0), new TimeOnly(11, 50)),
        (2, "SCI", new TimeOnly(9, 0), new TimeOnly(9, 50)),
        (2, "ICT", new TimeOnly(10, 0), new TimeOnly(10, 50)),
        (2, "SOC", new TimeOnly(11, 0), new TimeOnly(11, 50)),
        (3, "BAN", new TimeOnly(9, 0), new TimeOnly(9, 50)),
        (3, "ENG", new TimeOnly(10, 0), new TimeOnly(10, 50)),
        (3, "MAT", new TimeOnly(11, 0), new TimeOnly(11, 50)),
        (4, "SCI", new TimeOnly(9, 0), new TimeOnly(9, 50)),
        (4, "ICT", new TimeOnly(10, 0), new TimeOnly(10, 50)),
        (4, "SOC", new TimeOnly(11, 0), new TimeOnly(11, 50)),
        (5, "BAN", new TimeOnly(9, 0), new TimeOnly(9, 50)),
        (5, "ENG", new TimeOnly(10, 0), new TimeOnly(10, 50)),
        (5, "MAT", new TimeOnly(11, 0), new TimeOnly(11, 50)),
    ];

    internal static DemoAcademicData Create()
    {
        var subjects = new List<DemoAcademicSubjectData>(ClassCount * SubjectsPerClass);
        var batches = new List<DemoAcademicBatchData>(ClassCount * BatchesPerClass);
        var routines = new List<DemoAcademicRoutineData>(ClassCount * BatchesPerClass * RoutineSlotsPerBatch);

        foreach (var classLevel in Enumerable.Range(1, ClassCount))
        {
            foreach (var template in SubjectTemplates)
            {
                subjects.Add(new DemoAcademicSubjectData(
                    classLevel,
                    template.Name,
                    $"DEMO-C{classLevel:D2}-{template.Code}"));
            }

            for (var batchIndex = 0; batchIndex < BatchTemplates.Length; batchIndex++)
            {
                var template = BatchTemplates[batchIndex];
                var batchCode = $"DEMO-C{classLevel:D2}-{template.Code}";
                batches.Add(new DemoAcademicBatchData(
                    classLevel,
                    template.Name,
                    batchCode));

                foreach (var routineTemplate in RoutineTemplates)
                {
                    routines.Add(new DemoAcademicRoutineData(
                        classLevel,
                        batchCode,
                        $"DEMO-C{classLevel:D2}-{routineTemplate.SubjectCode}",
                        routineTemplate.DayOfWeek,
                        routineTemplate.StartTime,
                        routineTemplate.EndTime,
                        $"R-{classLevel:D2}-{batchIndex + 1}",
                        TeachersBySubjectCode[routineTemplate.SubjectCode]));
                }
            }
        }

        return new DemoAcademicData(subjects, batches, routines);
    }
}
