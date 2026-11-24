using Coaching.BuildingBlocks;

namespace Coaching.Academic.Domain;

/// <summary>
/// A named teaching group within a class level, such as Morning, Evening, or Batch A.
/// Subjects remain attached to the class level and are shared by its batches.
/// </summary>
public class AcademicBatch : Entity
{
    public int ClassLevel { get; set; }
    public string Name { get; set; } = default!;
    public string? Code { get; set; }
}
