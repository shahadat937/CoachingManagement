using Coaching.BuildingBlocks.Contracts;

namespace Coaching.Students.Application;

/// <summary>
/// Stages integration events in the Students database. The implementation shares the
/// request DbContext, so the student and its event commit in one transaction.
/// </summary>
public interface IStudentEventOutbox
{
    Task EnqueueAsync(StudentEnrolled @event, CancellationToken ct = default);
}
