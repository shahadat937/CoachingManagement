using System.ComponentModel.DataAnnotations;
using Coaching.BuildingBlocks.Security;
using Coaching.Identity.Domain;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Coaching.Identity.Application.Features;

public sealed record AppUserResponse(Guid Id, string Email, string FullName, string Role)
{
    public static AppUserResponse From(AppUser user) => new(user.Id, user.Email, user.FullName, user.Role);
}

public sealed record AuthResponse(string AccessToken, DateTimeOffset ExpiresAt, AppUserResponse User);

public sealed class UserInputException(string message) : Exception(message);
public sealed class DuplicateEmailException : Exception
{
    public DuplicateEmailException(string email) : base($"A user with email '{email}' already exists.") { }
}

public record ListAppUsersQuery : IRequest<IReadOnlyList<AppUserResponse>>;

public class ListAppUsersHandler(IAppUserStore store) : IRequestHandler<ListAppUsersQuery, IReadOnlyList<AppUserResponse>>
{
    public async Task<IReadOnlyList<AppUserResponse>> Handle(ListAppUsersQuery q, CancellationToken ct) =>
        (await store.ListAsync(ct)).Select(AppUserResponse.From).ToList();
}

public record CreateAppUserCommand(string? Email, string? FullName, string? Role, string? Password) : IRequest<AppUserResponse>;

public class CreateAppUserHandler(
    IAppUserStore store,
    IPasswordHasher<AppUser> passwordHasher) : IRequestHandler<CreateAppUserCommand, AppUserResponse>
{
    public async Task<AppUserResponse> Handle(CreateAppUserCommand command, CancellationToken ct)
    {
        var email = UserInput.NormalizeEmail(command.Email);
        var fullName = UserInput.NormalizeFullName(command.FullName);
        var role = UserInput.NormalizeRole(command.Role);
        UserInput.ValidatePassword(command.Password);

        if (await store.FindByEmailAsync(email, ct) is not null)
            throw new DuplicateEmailException(email);

        var user = new AppUser(email, fullName, role);
        user.SetPasswordHash(passwordHasher.HashPassword(user, command.Password!));
        await store.AddAsync(user, ct);
        await store.SaveChangesAsync(ct);
        return AppUserResponse.From(user);
    }
}

public record LoginCommand(string? Email, string? Password) : IRequest<AuthResponse?>;

public class LoginHandler(
    IAppUserStore store,
    IPasswordHasher<AppUser> passwordHasher,
    ITokenIssuer tokenIssuer) : IRequestHandler<LoginCommand, AuthResponse?>
{
    public async Task<AuthResponse?> Handle(LoginCommand command, CancellationToken ct)
    {
        string email;
        try
        {
            email = UserInput.NormalizeEmail(command.Email);
            UserInput.ValidatePassword(command.Password);
        }
        catch (UserInputException)
        {
            return null;
        }

        var user = await store.FindByEmailAsync(email, ct);
        if (user is null || string.IsNullOrEmpty(user.PasswordHash))
            return null;

        try
        {
            AppRoles.Normalize(user.Role);
        }
        catch (ArgumentOutOfRangeException)
        {
            return null;
        }

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, command.Password!);
        if (verification == PasswordVerificationResult.Failed)
            return null;

        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.SetPasswordHash(passwordHasher.HashPassword(user, command.Password!));
            await store.SaveChangesAsync(ct);
        }

        var token = tokenIssuer.Issue(user);
        return new AuthResponse(token.Value, token.ExpiresAt, AppUserResponse.From(user));
    }
}

internal static class UserInput
{
    private const int MinimumPasswordLength = 12;
    private static readonly EmailAddressAttribute EmailValidator = new();

    public static string NormalizeEmail(string? value)
    {
        var email = value?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || email.Length > 320 || !EmailValidator.IsValid(email))
            throw new UserInputException("A valid email address is required.");

        return email;
    }

    public static string NormalizeFullName(string? value)
    {
        var fullName = value?.Trim();
        if (string.IsNullOrWhiteSpace(fullName) || fullName.Length is < 2 or > 200)
            throw new UserInputException("Full name must contain 2 to 200 characters.");

        return fullName;
    }

    public static string NormalizeRole(string? value)
    {
        try
        {
            return AppRoles.Normalize(value);
        }
        catch (ArgumentOutOfRangeException exception)
        {
            throw new UserInputException(exception.Message);
        }
    }

    public static void ValidatePassword(string? value)
    {
        if (string.IsNullOrEmpty(value) || value.Length < MinimumPasswordLength || value.Length > 128)
            throw new UserInputException($"Password must contain {MinimumPasswordLength} to 128 characters.");
    }
}
