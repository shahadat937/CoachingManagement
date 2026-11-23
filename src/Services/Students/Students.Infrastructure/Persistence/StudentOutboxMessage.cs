namespace Coaching.Students.Infrastructure;

/// <summary>
/// Durable delivery record for StudentEnrolled. Messages are retained after delivery
/// and may safely be published more than once.
/// </summary>
public class StudentOutboxMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public string FullName { get; set; } = default!;
    public int ClassLevel { get; set; }
    public string? DeviceUserId { get; set; }
    public string GuardianPhone { get; set; } = default!;
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? PublishedAt { get; set; }
    public int Attempts { get; set; }
    public DateTimeOffset? NextAttemptAt { get; set; }
    public string? LastError { get; set; }
}
