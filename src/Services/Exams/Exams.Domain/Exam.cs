using Coaching.BuildingBlocks;

namespace Coaching.Exams.Domain;

public class Exam : Entity
{
    public string Title { get; set; } = default!;
    public int ClassLevel { get; set; }
    public Guid SubjectId { get; set; }
    public DateOnly ExamDate { get; set; }
    public decimal TotalMarks { get; set; }
}
