using Coaching.BuildingBlocks;

namespace Coaching.Identity.Domain;

public class AppUser : Entity
{
    public string Email { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Role { get; set; } = "Student"; // Admin | Accountant | Teacher | Student | Guardian
    public string PasswordHash { get; set; } = default!; // TODO: hash + JWT issuing
}
