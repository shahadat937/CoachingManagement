using Coaching.BuildingBlocks;

namespace Coaching.Academic.Domain;

public class Subject : Entity
{
    public string Name { get; set; } = default!;
    public string Code { get; set; } = default!;
    public int ClassLevel { get; set; } // 1..12
}
