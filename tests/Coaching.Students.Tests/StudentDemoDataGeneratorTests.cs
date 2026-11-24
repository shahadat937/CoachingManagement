using Coaching.Students.Infrastructure.Persistence;
using Xunit;

namespace Coaching.Students.Tests;

public class StudentDemoDataGeneratorTests
{
    [Fact]
    public void Create_generates_deterministic_valid_records_for_pagination_testing()
    {
        var now = new DateTimeOffset(2026, 11, 24, 8, 0, 0, TimeSpan.Zero);

        var students = StudentDemoDataGenerator.Create(250, now);

        Assert.Equal(250, students.Count);
        Assert.Equal(250, students.Select(student => student.StudentNo).Distinct(StringComparer.OrdinalIgnoreCase).Count());
        Assert.Equal(225, students.Count(student => student.IsActive));
        Assert.Equal(25, students.Count(student => !student.IsActive));
        Assert.All(students, student =>
        {
            Assert.StartsWith(StudentDemoDataGenerator.StudentNoPrefix, student.StudentNo);
            Assert.InRange(student.ClassLevel, 1, 12);
            Assert.StartsWith("+88017", student.GuardianPhone);
            if (student.IsActive)
                Assert.Null(student.DeactivatedAt);
            else
                Assert.NotNull(student.DeactivatedAt);
        });
    }

    [Fact]
    public void Create_is_repeatable_for_the_same_requested_count()
    {
        var now = new DateTimeOffset(2026, 11, 24, 8, 0, 0, TimeSpan.Zero);

        var first = StudentDemoDataGenerator.Create(50, now);
        var second = StudentDemoDataGenerator.Create(50, now);

        Assert.Equal(first, second);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1_001)]
    public void Create_rejects_counts_outside_the_safe_range(int count)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => StudentDemoDataGenerator.Create(count, DateTimeOffset.UtcNow));
    }
}
