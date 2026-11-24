using Coaching.Students.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Coaching.Students.Infrastructure.Persistence;

/// <summary>
/// Adds predictable, local-only records for manually exercising the student directory.
/// It intentionally writes directly to the Students database and does not create outbox events.
/// </summary>
public static class StudentDemoDataSeeder
{
    public const string SectionName = "StudentDemoData";

    public static async Task SeedAsync(
        this IServiceProvider services,
        IHostEnvironment environment,
        IConfiguration configuration,
        CancellationToken ct = default)
    {
        if (!environment.IsDevelopment() || !configuration.GetValue<bool>($"{SectionName}:Enabled"))
            return;

        var count = configuration.GetValue<int?>($"{SectionName}:Count") ?? StudentDemoDataGenerator.DefaultCount;
        if (count is < 1 or > StudentDemoDataGenerator.MaximumCount)
        {
            throw new InvalidOperationException(
                $"{SectionName}:Count must be between 1 and {StudentDemoDataGenerator.MaximumCount}.");
        }

        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<StudentsDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger("StudentDemoDataSeeder");
        var demoStudents = StudentDemoDataGenerator.Create(count, DateTimeOffset.UtcNow);
        var existingStudentNumbers = await db.Students
            .AsNoTracking()
            .Where(student => student.StudentNo.StartsWith(StudentDemoDataGenerator.StudentNoPrefix))
            .Select(student => student.StudentNo)
            .ToHashSetAsync(StringComparer.OrdinalIgnoreCase, ct);
        var newStudents = demoStudents
            .Where(student => !existingStudentNumbers.Contains(student.StudentNo))
            .Select(student => new Student
            {
                StudentNo = student.StudentNo,
                FullName = student.FullName,
                ClassLevel = student.ClassLevel,
                GuardianPhone = student.GuardianPhone,
                DeviceUserId = null,
                IsActive = student.IsActive,
                DeactivatedAt = student.DeactivatedAt,
            })
            .ToList();

        if (newStudents.Count > 0)
        {
            await db.Students.AddRangeAsync(newStudents, ct);
            await db.SaveChangesAsync(ct);
        }

        logger.LogInformation(
            "Student demo data ready: {Inserted} inserted and {Existing} already present (requested {Requested}).",
            newStudents.Count,
            demoStudents.Count - newStudents.Count,
            demoStudents.Count);
    }
}

internal sealed record DemoStudentData(
    string StudentNo,
    string FullName,
    int ClassLevel,
    string GuardianPhone,
    bool IsActive,
    DateTimeOffset? DeactivatedAt);

internal static class StudentDemoDataGenerator
{
    internal const int DefaultCount = 250;
    internal const int MaximumCount = 1_000;
    internal const string StudentNoPrefix = "DEMO-ST-";

    private static readonly string[] GivenNames =
    [
        "Aarif", "Afsana", "Amina", "Arif", "Farhan", "Fatima", "Hasan", "Ishrat", "Jannat", "Mahin",
        "Maliha", "Mehedi", "Mim", "Nabila", "Nafis", "Nusrat", "Rafi", "Sadia", "Sakib", "Tania",
    ];

    private static readonly string[] FamilyNames =
    [
        "Ahmed", "Akter", "Begum", "Chowdhury", "Das", "Hossain", "Islam", "Khan", "Rahman", "Sarkar",
    ];

    internal static IReadOnlyList<DemoStudentData> Create(int count, DateTimeOffset now)
    {
        if (count is < 1 or > MaximumCount)
            throw new ArgumentOutOfRangeException(nameof(count), $"Count must be between 1 and {MaximumCount}.");

        var activeCount = count == 1
            ? 1
            : Math.Clamp((int)Math.Round(count * .9, MidpointRounding.AwayFromZero), 1, count - 1);

        return Enumerable.Range(1, count)
            .Select(number =>
            {
                var isActive = number <= activeCount;
                return new DemoStudentData(
                    $"{StudentNoPrefix}{number:D4}",
                    $"{GivenNames[(number - 1) % GivenNames.Length]} {FamilyNames[((number - 1) / GivenNames.Length) % FamilyNames.Length]}",
                    ((number - 1) % 12) + 1,
                    $"+88017{number:D8}",
                    isActive,
                    isActive ? null : now.AddDays(-(count - number + 1)));
            })
            .ToArray();
    }
}
