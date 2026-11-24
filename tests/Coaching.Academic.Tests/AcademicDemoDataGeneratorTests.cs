using Coaching.Academic.Infrastructure;
using Xunit;

namespace Coaching.Academic.Tests;

public class AcademicDemoDataGeneratorTests
{
    [Fact]
    public void Create_generates_subjects_and_multiple_batches_for_every_class()
    {
        var data = AcademicDemoDataGenerator.Create();

        Assert.Equal(
            AcademicDemoDataGenerator.ClassCount * AcademicDemoDataGenerator.SubjectsPerClass,
            data.Subjects.Count);
        Assert.Equal(
            AcademicDemoDataGenerator.ClassCount * AcademicDemoDataGenerator.BatchesPerClass,
            data.Batches.Count);

        foreach (var classLevel in Enumerable.Range(1, AcademicDemoDataGenerator.ClassCount))
        {
            Assert.Equal(
                AcademicDemoDataGenerator.SubjectsPerClass,
                data.Subjects.Count(subject => subject.ClassLevel == classLevel));
            Assert.Equal(
                AcademicDemoDataGenerator.BatchesPerClass,
                data.Batches.Count(batch => batch.ClassLevel == classLevel));
        }
    }

    [Fact]
    public void Create_generates_unique_class_scoped_codes()
    {
        var data = AcademicDemoDataGenerator.Create();

        Assert.Equal(
            data.Subjects.Count,
            data.Subjects.Select(subject => (subject.ClassLevel, subject.Code)).Distinct().Count());
        Assert.Equal(
            data.Batches.Count,
            data.Batches.Select(batch => (batch.ClassLevel, batch.Code)).Distinct().Count());
        Assert.All(data.Subjects, subject => Assert.StartsWith($"DEMO-C{subject.ClassLevel:D2}-", subject.Code));
        Assert.All(data.Batches, batch => Assert.StartsWith($"DEMO-C{batch.ClassLevel:D2}-", batch.Code));
    }
}
