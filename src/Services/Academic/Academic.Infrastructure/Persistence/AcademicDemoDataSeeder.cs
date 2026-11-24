using Coaching.Academic.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Coaching.Academic.Infrastructure;

/// <summary>
/// Adds predictable, local-only academic setup records for exercising the class,
/// subject, and batch screens. Existing records are never changed or duplicated.
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

        logger.LogInformation(
            "Academic demo data ready: {SubjectsInserted} subjects and {BatchesInserted} batches inserted.",
            subjectsToAdd.Length,
            batchesToAdd.Length);
    }

    private static string NameKey(int classLevel, string name) => $"{classLevel}\u001F{name.Trim()}";

    private static string CodeKey(int classLevel, string code) => $"{classLevel}\u001F{code.Trim()}";

    private sealed record AcademicRecordKey(int ClassLevel, string Name, string? Code);
}

internal sealed record DemoAcademicSubjectData(int ClassLevel, string Name, string Code);
internal sealed record DemoAcademicBatchData(int ClassLevel, string Name, string Code);
internal sealed record DemoAcademicData(
    IReadOnlyList<DemoAcademicSubjectData> Subjects,
    IReadOnlyList<DemoAcademicBatchData> Batches);

internal static class AcademicDemoDataGenerator
{
    internal const int ClassCount = 12;
    internal const int SubjectsPerClass = 6;
    internal const int BatchesPerClass = 3;

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

    internal static DemoAcademicData Create()
    {
        var subjects = new List<DemoAcademicSubjectData>(ClassCount * SubjectsPerClass);
        var batches = new List<DemoAcademicBatchData>(ClassCount * BatchesPerClass);

        foreach (var classLevel in Enumerable.Range(1, ClassCount))
        {
            foreach (var template in SubjectTemplates)
            {
                subjects.Add(new DemoAcademicSubjectData(
                    classLevel,
                    template.Name,
                    $"DEMO-C{classLevel:D2}-{template.Code}"));
            }

            foreach (var template in BatchTemplates)
            {
                batches.Add(new DemoAcademicBatchData(
                    classLevel,
                    template.Name,
                    $"DEMO-C{classLevel:D2}-{template.Code}"));
            }
        }

        return new DemoAcademicData(subjects, batches);
    }
}
