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
    public async Task Bulk_setup_creates_all_subjects_and_batches_with_one_save()
    {
        var store = new InMemoryAcademicStore();
        var handler = new SaveAcademicSetupHandler(store);

        var setup = await handler.Handle(
            new SaveAcademicSetupCommand(
                8,
                [
                    new AcademicSetupSubjectInput(" General   Mathematics ", " math-08 "),
                    new AcademicSetupSubjectInput("English", "eng-08"),
                ],
                [
                    new AcademicSetupBatchInput(" Morning ", "m-8"),
                    new AcademicSetupBatchInput("Evening", null),
                ]),
            CancellationToken.None);

        Assert.Equal(2, setup.Subjects.Count);
        Assert.Equal(2, setup.Batches.Count);
        Assert.Equal("General Mathematics", setup.Subjects[0].Name);
        Assert.Equal("MATH-08", setup.Subjects[0].Code);
        Assert.Equal("Morning", setup.Batches[0].Name);
        Assert.Equal("M-8", setup.Batches[0].Code);
        Assert.Equal(2, store.Subjects.Count);
        Assert.Equal(2, store.Batches.Count);
        Assert.Equal(1, store.SaveChangesCount);
    }

    [Fact]
    public async Task Bulk_setup_rejects_duplicates_before_writing_any_records()
    {
        var store = new InMemoryAcademicStore();
        var handler = new SaveAcademicSetupHandler(store);

        var duplicate = await Assert.ThrowsAsync<AcademicConflictException>(() =>
            handler.Handle(
                new SaveAcademicSetupCommand(
                    8,
                    [
                        new AcademicSetupSubjectInput("Mathematics", "MATH-08"),
                        new AcademicSetupSubjectInput(" mathematics ", "ADV-MATH-08"),
                    ],
                    [new AcademicSetupBatchInput("Morning", "M-8")]),
                CancellationToken.None));

        Assert.Equal("subjects", duplicate.Field);
        Assert.Empty(store.Subjects);
        Assert.Empty(store.Batches);
        Assert.Equal(0, store.SaveChangesCount);
    }

    [Fact]
    public async Task Bulk_setup_rejects_existing_class_records_before_writing_any_records()
    {
        var store = new InMemoryAcademicStore();
        store.Subjects.Add(Subject(8, "Mathematics", "MATH-08"));
        var handler = new SaveAcademicSetupHandler(store);

        var duplicate = await Assert.ThrowsAsync<AcademicConflictException>(() =>
            handler.Handle(
                new SaveAcademicSetupCommand(
                    8,
                    [new AcademicSetupSubjectInput("Mathematics", "ADV-MATH-08")],
                    [new AcademicSetupBatchInput("Morning", "M-8")]),
                CancellationToken.None));

        Assert.Equal("subjects", duplicate.Field);
        Assert.Single(store.Subjects);
        Assert.Empty(store.Batches);
        Assert.Equal(0, store.SaveChangesCount);
    }

    [Fact]
    public async Task Bulk_setup_requires_at_least_one_record()
    {
        var exception = await Assert.ThrowsAsync<AcademicInputException>(() =>
            new SaveAcademicSetupHandler(new InMemoryAcademicStore()).Handle(
                new SaveAcademicSetupCommand(8, [], []),
                CancellationToken.None));

        Assert.Equal("setup", exception.Field);
    }

    [Fact]
    public async Task Routine_creation_links_a_class_subject_to_its_batch_and_normalizes_room_and_teacher()
    {
        var store = new InMemoryAcademicStore();
        var subject = Subject(8, "Mathematics", "MATH-08");
        var batch = Batch(8, "Morning", "M-8");
        store.Subjects.Add(subject);
        store.Batches.Add(batch);

        var routine = await new CreateBatchRoutineHandler(store).Handle(
            new CreateBatchRoutineCommand(
                batch.Id,
                subject.Id,
                1,
                new TimeOnly(9, 0),
                new TimeOnly(9, 50),
                "  Room   201 ",
                "  Ms.   Nabila  "),
            CancellationToken.None);

        Assert.Equal(batch.Id, routine.BatchId);
        Assert.Equal(subject.Id, routine.SubjectId);
        Assert.Equal("Mathematics", routine.SubjectName);
        Assert.Equal("Room 201", routine.RoomCode);
        Assert.Equal("Ms. Nabila", routine.TeacherName);
        Assert.Single(store.RoutineSlots);
        Assert.Equal(1, store.SaveChangesCount);
    }

    [Fact]
    public async Task Routine_creation_rejects_a_teacher_name_longer_than_100_characters()
    {
        var store = new InMemoryAcademicStore();
        var subject = Subject(8, "Mathematics", "MATH-08");
        var batch = Batch(8, "Morning", "M-8");
        store.Subjects.Add(subject);
        store.Batches.Add(batch);

        var exception = await Assert.ThrowsAsync<AcademicInputException>(() =>
            new CreateBatchRoutineHandler(store).Handle(
                new CreateBatchRoutineCommand(
                    batch.Id,
                    subject.Id,
                    1,
                    new TimeOnly(9, 0),
                    new TimeOnly(9, 50),
                    "R-201",
                    new string('A', 101)),
                CancellationToken.None));

        Assert.Equal("teacherName", exception.Field);
        Assert.Empty(store.RoutineSlots);
    }

    [Fact]
    public async Task Routine_creation_treats_a_blank_teacher_name_as_missing()
    {
        var store = new InMemoryAcademicStore();
        var subject = Subject(8, "Mathematics", "MATH-08");
        var batch = Batch(8, "Morning", "M-8");
        store.Subjects.Add(subject);
        store.Batches.Add(batch);

        var routine = await new CreateBatchRoutineHandler(store).Handle(
            new CreateBatchRoutineCommand(
                batch.Id,
                subject.Id,
                1,
                new TimeOnly(9, 0),
                new TimeOnly(9, 50),
                "R-201",
                "   "),
            CancellationToken.None);

        Assert.Null(routine.TeacherName);
        Assert.Null(store.RoutineSlots.Single().TeacherName);
    }

    [Fact]
    public async Task Routine_creation_rejects_a_subject_from_another_class()
    {
        var store = new InMemoryAcademicStore();
        var classEightSubject = Subject(8, "Mathematics", "MATH-08");
        var classNineSubject = Subject(9, "Physics", "PHY-09");
        var batch = Batch(8, "Morning", "M-8");
        store.Subjects.AddRange([classEightSubject, classNineSubject]);
        store.Batches.Add(batch);

        var exception = await Assert.ThrowsAsync<AcademicInputException>(() =>
            new CreateBatchRoutineHandler(store).Handle(
                new CreateBatchRoutineCommand(
                    batch.Id,
                    classNineSubject.Id,
                    1,
                    new TimeOnly(9, 0),
                    new TimeOnly(9, 50),
                    "R-201"),
                CancellationToken.None));

        Assert.Equal("subjectId", exception.Field);
        Assert.Empty(store.RoutineSlots);
        Assert.Equal(0, store.SaveChangesCount);
    }

    [Fact]
    public async Task Routine_creation_rejects_overlaps_but_allows_adjacent_lessons()
    {
        var store = new InMemoryAcademicStore();
        var math = Subject(8, "Mathematics", "MATH-08");
        var english = Subject(8, "English", "ENG-08");
        var batch = Batch(8, "Morning", "M-8");
        store.Subjects.AddRange([math, english]);
        store.Batches.Add(batch);
        var handler = new CreateBatchRoutineHandler(store);

        await handler.Handle(
            new CreateBatchRoutineCommand(batch.Id, math.Id, 1, new TimeOnly(9, 0), new TimeOnly(9, 50), "R-201"),
            CancellationToken.None);
        var adjacent = await handler.Handle(
            new CreateBatchRoutineCommand(batch.Id, english.Id, 1, new TimeOnly(9, 50), new TimeOnly(10, 40), "R-201"),
            CancellationToken.None);
        var overlap = await Assert.ThrowsAsync<AcademicConflictException>(() =>
            handler.Handle(
                new CreateBatchRoutineCommand(batch.Id, english.Id, 1, new TimeOnly(9, 30), new TimeOnly(10, 20), "R-201"),
                CancellationToken.None));

        Assert.Equal("routine", overlap.Field);
        Assert.Equal(new TimeOnly(9, 50), adjacent.StartTime);
        Assert.Equal(2, store.RoutineSlots.Count);
    }

    [Fact]
    public async Task Routine_can_be_updated_listed_in_weekly_order_and_deleted()
    {
        var store = new InMemoryAcademicStore();
        var math = Subject(8, "Mathematics", "MATH-08");
        var english = Subject(8, "English", "ENG-08");
        var batch = Batch(8, "Morning", "M-8");
        store.Subjects.AddRange([math, english]);
        store.Batches.Add(batch);
        var create = new CreateBatchRoutineHandler(store);
        var monday = await create.Handle(
            new CreateBatchRoutineCommand(batch.Id, math.Id, 1, new TimeOnly(10, 0), new TimeOnly(10, 50), "R-201"),
            CancellationToken.None);
        await create.Handle(
            new CreateBatchRoutineCommand(batch.Id, english.Id, 2, new TimeOnly(9, 0), new TimeOnly(9, 50), "R-202"),
            CancellationToken.None);

        var updated = await new UpdateBatchRoutineHandler(store).Handle(
            new UpdateBatchRoutineCommand(
                monday.Id,
                batch.Id,
                english.Id,
                1,
                new TimeOnly(9, 0),
                new TimeOnly(9, 50),
                "R-203",
                " Mr. Hasan "),
            CancellationToken.None);
        var listed = await new ListBatchRoutineHandler(store).Handle(new ListBatchRoutineQuery(batch.Id), CancellationToken.None);
        await new DeleteBatchRoutineHandler(store).Handle(new DeleteBatchRoutineCommand(monday.Id), CancellationToken.None);

        Assert.Equal("English", updated.SubjectName);
        Assert.Equal("R-203", updated.RoomCode);
        Assert.Equal("Mr. Hasan", updated.TeacherName);
        Assert.Equal(2, listed.Count);
        Assert.Equal(1, listed[0].DayOfWeek);
        Assert.Equal(2, listed[1].DayOfWeek);
        Assert.Single(store.RoutineSlots);
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
        public List<BatchRoutineSlot> RoutineSlots { get; } = [];
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

        public Task<Subject?> FindSubjectByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(Subjects.FirstOrDefault(subject => subject.Id == id));

        public Task<AcademicBatch?> FindBatchByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(Batches.FirstOrDefault(batch => batch.Id == id));

        public Task<IReadOnlyList<BatchRoutineSlot>> ListRoutineSlotsAsync(Guid batchId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<BatchRoutineSlot>>(RoutineSlots
                .Where(slot => slot.BatchId == batchId)
                .OrderBy(slot => slot.DayOfWeek)
                .ThenBy(slot => slot.StartTime)
                .ToArray());

        public Task<BatchRoutineSlot?> FindRoutineSlotByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(RoutineSlots.FirstOrDefault(slot => slot.Id == id));

        public Task<bool> HasRoutineOverlapAsync(
            Guid batchId,
            int dayOfWeek,
            TimeOnly startTime,
            TimeOnly endTime,
            Guid? excludingSlotId = null,
            CancellationToken ct = default) =>
            Task.FromResult(RoutineSlots.Any(slot =>
                slot.BatchId == batchId
                && slot.DayOfWeek == dayOfWeek
                && (excludingSlotId is null || slot.Id != excludingSlotId)
                && slot.StartTime < endTime
                && startTime < slot.EndTime));

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

        public Task AddRoutineSlotAsync(BatchRoutineSlot slot, CancellationToken ct = default)
        {
            RoutineSlots.Add(slot);
            return Task.CompletedTask;
        }

        public void RemoveRoutineSlot(BatchRoutineSlot slot) => RoutineSlots.Remove(slot);

        public Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            SaveChangesCount++;
            return Task.FromResult(1);
        }
    }
}
