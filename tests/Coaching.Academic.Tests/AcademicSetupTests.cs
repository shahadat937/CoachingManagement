using Coaching.Academic.Application;
using Coaching.Academic.Application.Features;
using Coaching.Academic.Domain;
using Xunit;

namespace Coaching.Academic.Tests;

public class AcademicSetupTests
{
    [Fact]
    public async Task Subject_creation_normalizes_class_scoped_input()
    {
        var store = new InMemoryAcademicStore();
        var handler = new CreateSubjectHandler(store);

        var subject = await handler.Handle(
            new CreateSubjectCommand(8, "  General   Mathematics ", " math_08 "),
            CancellationToken.None);

        Assert.Equal(8, subject.ClassLevel);
        Assert.Equal("General Mathematics", subject.Name);
        Assert.Equal("MATH_08", subject.Code);
        var stored = Assert.Single(store.Subjects);
        Assert.Equal(subject.Name, stored.Name);
        Assert.Equal(subject.Code, stored.Code);
        Assert.Equal(1, store.SaveChangesCount);
    }

    [Fact]
    public async Task Subject_creation_rejects_duplicate_code_or_name_within_the_same_class()
    {
        var store = new InMemoryAcademicStore();
        var handler = new CreateSubjectHandler(store);
        await handler.Handle(new CreateSubjectCommand(8, "Mathematics", "MATH-08"), CancellationToken.None);

        var duplicateCode = await Assert.ThrowsAsync<AcademicConflictException>(() =>
            handler.Handle(new CreateSubjectCommand(8, "Advanced Mathematics", "math-08"), CancellationToken.None));
        var duplicateName = await Assert.ThrowsAsync<AcademicConflictException>(() =>
            handler.Handle(new CreateSubjectCommand(8, "  Mathematics ", "ADV-MATH-08"), CancellationToken.None));
        var otherClass = await handler.Handle(
            new CreateSubjectCommand(9, "Mathematics", "MATH-09"),
            CancellationToken.None);

        Assert.Equal("code", duplicateCode.Field);
        Assert.Equal("name", duplicateName.Field);
        Assert.Equal(9, otherClass.ClassLevel);
        Assert.Equal(2, store.Subjects.Count);
    }

    [Fact]
    public async Task A_class_can_have_multiple_named_batches_but_not_duplicates()
    {
        var store = new InMemoryAcademicStore();
        var handler = new CreateBatchHandler(store);

        var morning = await handler.Handle(new CreateBatchCommand(8, " Morning ", "m-8"), CancellationToken.None);
        var evening = await handler.Handle(new CreateBatchCommand(8, "Evening", "E-8"), CancellationToken.None);
        var classNineMorning = await handler.Handle(new CreateBatchCommand(9, "Morning", "M-9"), CancellationToken.None);
        var duplicate = await Assert.ThrowsAsync<AcademicConflictException>(() =>
            handler.Handle(new CreateBatchCommand(8, "morning", "AM-8"), CancellationToken.None));

        Assert.Equal("Morning", morning.Name);
        Assert.Equal("M-8", morning.Code);
        Assert.Equal("Evening", evening.Name);
        Assert.Equal(9, classNineMorning.ClassLevel);
        Assert.Equal("name", duplicate.Field);
        Assert.Equal(3, store.Batches.Count);
    }

    [Fact]
    public async Task Class_summary_returns_all_levels_with_class_scoped_counts()
    {
        var store = new InMemoryAcademicStore();
        store.Subjects.AddRange([
            Subject(8, "Mathematics", "MATH-08"),
            Subject(8, "English", "ENG-08"),
            Subject(10, "Physics", "PHY-10"),
        ]);
        store.Batches.AddRange([
            Batch(8, "Morning", "M-8"),
            Batch(8, "Evening", "E-8"),
        ]);

        var classes = await new ListAcademicClassesHandler(store).Handle(
            new ListAcademicClassesQuery(),
            CancellationToken.None);

        Assert.Equal(12, classes.Count);
        Assert.Equal(new AcademicClassResponse(8, 2, 2), classes.Single(item => item.ClassLevel == 8));
        Assert.Equal(new AcademicClassResponse(10, 1, 0), classes.Single(item => item.ClassLevel == 10));
        Assert.Equal(new AcademicClassResponse(1, 0, 0), classes.Single(item => item.ClassLevel == 1));
    }

    [Fact]
    public async Task Class_filtered_lists_return_only_the_selected_class_and_reject_invalid_levels()
    {
        var store = new InMemoryAcademicStore();
        store.Subjects.AddRange([Subject(7, "Science", "SCI-07"), Subject(8, "Science", "SCI-08")]);
        store.Batches.AddRange([Batch(7, "Morning", null), Batch(8, "Evening", null)]);

        var subjects = await new ListSubjectsHandler(store).Handle(new ListSubjectsQuery(8), CancellationToken.None);
        var batches = await new ListBatchesHandler(store).Handle(new ListBatchesQuery(7), CancellationToken.None);
        var invalid = await Assert.ThrowsAsync<AcademicInputException>(() =>
            new ListSubjectsHandler(store).Handle(new ListSubjectsQuery(13), CancellationToken.None));

        Assert.Single(subjects);
        Assert.Equal(8, subjects[0].ClassLevel);
        Assert.Single(batches);
        Assert.Equal(7, batches[0].ClassLevel);
        Assert.Equal("classLevel", invalid.Field);
    }

    private static Subject Subject(int classLevel, string name, string code) => new()
    {
        ClassLevel = classLevel,
        Name = name,
        Code = code,
    };

    private static AcademicBatch Batch(int classLevel, string name, string? code) => new()
    {
        ClassLevel = classLevel,
        Name = name,
        Code = code,
    };

    private sealed class InMemoryAcademicStore : IAcademicStore
    {
        public List<Subject> Subjects { get; } = [];
        public List<AcademicBatch> Batches { get; } = [];
        public int SaveChangesCount { get; private set; }

        public Task<IReadOnlyList<Subject>> ListSubjectsAsync(int? classLevel, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<Subject>>(Subjects
                .Where(subject => classLevel is null || subject.ClassLevel == classLevel)
                .OrderBy(subject => subject.ClassLevel)
                .ThenBy(subject => subject.Name)
                .ToArray());

        public Task<IReadOnlyList<AcademicBatch>> ListBatchesAsync(int? classLevel, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<AcademicBatch>>(Batches
                .Where(batch => classLevel is null || batch.ClassLevel == classLevel)
                .OrderBy(batch => batch.ClassLevel)
                .ThenBy(batch => batch.Name)
                .ToArray());

        public Task<IReadOnlyDictionary<int, int>> CountSubjectsByClassLevelAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyDictionary<int, int>>(Subjects
                .GroupBy(subject => subject.ClassLevel)
                .ToDictionary(group => group.Key, group => group.Count()));

        public Task<IReadOnlyDictionary<int, int>> CountBatchesByClassLevelAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyDictionary<int, int>>(Batches
                .GroupBy(batch => batch.ClassLevel)
                .ToDictionary(group => group.Key, group => group.Count()));

        public Task<Subject?> FindSubjectByClassLevelAndNameAsync(int classLevel, string name, CancellationToken ct = default) =>
            Task.FromResult(Subjects.FirstOrDefault(subject => subject.ClassLevel == classLevel &&
                string.Equals(subject.Name, name, StringComparison.OrdinalIgnoreCase)));

        public Task<Subject?> FindSubjectByClassLevelAndCodeAsync(int classLevel, string code, CancellationToken ct = default) =>
            Task.FromResult(Subjects.FirstOrDefault(subject => subject.ClassLevel == classLevel &&
                string.Equals(subject.Code, code, StringComparison.OrdinalIgnoreCase)));

        public Task<AcademicBatch?> FindBatchByClassLevelAndNameAsync(int classLevel, string name, CancellationToken ct = default) =>
            Task.FromResult(Batches.FirstOrDefault(batch => batch.ClassLevel == classLevel &&
                string.Equals(batch.Name, name, StringComparison.OrdinalIgnoreCase)));

        public Task<AcademicBatch?> FindBatchByClassLevelAndCodeAsync(int classLevel, string code, CancellationToken ct = default) =>
            Task.FromResult(Batches.FirstOrDefault(batch => batch.ClassLevel == classLevel &&
                string.Equals(batch.Code, code, StringComparison.OrdinalIgnoreCase)));

        public Task AddSubjectAsync(Subject subject, CancellationToken ct = default)
        {
            Subjects.Add(subject);
            return Task.CompletedTask;
        }

        public Task AddBatchAsync(AcademicBatch batch, CancellationToken ct = default)
        {
            Batches.Add(batch);
            return Task.CompletedTask;
        }

        public Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            SaveChangesCount++;
            return Task.FromResult(1);
        }
    }
}
