using Coaching.BuildingBlocks;

namespace Coaching.Identity.Domain;

public class AppUser : Entity
{
    private AppUser() { }

    public AppUser(string email, string fullName, string role)
    {
        Email = email;
        FullName = fullName;
        Role = role;
    }

    public string Email { get; private set; } = default!;
    public string FullName { get; private set; } = default!;
    public string Role { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;

    public void SetPasswordHash(string passwordHash)
    {
        PasswordHash = string.IsNullOrWhiteSpace(passwordHash)
            ? throw new ArgumentException("A password hash is required.", nameof(passwordHash))
            : passwordHash;
    }
}
