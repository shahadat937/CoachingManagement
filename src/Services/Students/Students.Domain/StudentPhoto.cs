namespace Coaching.Students.Domain;

/// <summary>
/// Private image bytes associated with one student. The photo is intentionally
/// persisted separately from the student record and is never exposed as a URL.
/// </summary>
public class StudentPhoto
{
    public Guid StudentId { get; set; }
    public byte[] Content { get; set; } = [];
    public string ContentType { get; set; } = default!;
    public long SizeBytes { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
