using Coaching.BuildingBlocks;

namespace Coaching.Accounts.Domain;

public class FeeInvoice : Entity
{
    public Guid StudentId { get; set; }
    public string Title { get; set; } = default!; // e.g. "Monthly fee - March"
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public DateOnly DueDate { get; set; }
}
