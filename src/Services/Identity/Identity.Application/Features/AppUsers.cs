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
public sealed record AuthSession(AuthResponse Response, string RefreshToken, DateTimeOffset RefreshTokenExpiresAt);

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

public record LoginCommand(string? Email, string? Password) : IRequest<AuthSession?>;

public class LoginHandler(
    IAppUserStore store,
    IPasswordHasher<AppUser> passwordHasher,
    ITokenIssuer tokenIssuer,
    IRefreshTokenStore refreshTokenStore,
    IRefreshTokenFactory refreshTokenFactory,
    TimeProvider timeProvider) : IRequestHandler<LoginCommand, AuthSession?>
{
    public async Task<AuthSession?> Handle(LoginCommand command, CancellationToken ct)
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

        if (!TokenEligibility.CanIssueTokensFor(user))
            return null;

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, command.Password!);
        if (verification == PasswordVerificationResult.Failed)
            return null;

        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.SetPasswordHash(passwordHasher.HashPassword(user, command.Password!));
            await store.SaveChangesAsync(ct);
        }

        var now = timeProvider.GetUtcNow();
        var refreshToken = refreshTokenFactory.Create(now);
        await refreshTokenStore.AddAsync(new RefreshToken(user.Id, refreshToken.Hash, refreshToken.ExpiresAt), ct);
        await refreshTokenStore.SaveChangesAsync(ct);

        var accessToken = tokenIssuer.Issue(user);
        return new AuthSession(
            new AuthResponse(accessToken.Value, accessToken.ExpiresAt, AppUserResponse.From(user)),
            refreshToken.Value,
            refreshToken.ExpiresAt);
    }
}

public record RefreshSessionCommand(string? RefreshToken) : IRequest<AuthSession?>;

public class RefreshSessionHandler(
    IAppUserStore userStore,
    IRefreshTokenStore refreshTokenStore,
    IRefreshTokenFactory refreshTokenFactory,
    ITokenIssuer tokenIssuer,
    TimeProvider timeProvider) : IRequestHandler<RefreshSessionCommand, AuthSession?>
{
    public async Task<AuthSession?> Handle(RefreshSessionCommand command, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken))
            return null;

        var now = timeProvider.GetUtcNow();
        var tokenHash = refreshTokenFactory.Hash(command.RefreshToken);
        var current = await refreshTokenStore.FindByTokenHashAsync(tokenHash, ct);
        if (current is null)
            return null;

        if (!current.IsActive(now))
        {
            if (current.RevokedAt is not null && !string.IsNullOrEmpty(current.ReplacedByTokenHash))
                await refreshTokenStore.RevokeActiveForUserAsync(current.UserId, now, ct);

            return null;
        }

        var user = await userStore.GetByIdAsync(current.UserId, ct);
        if (user is null || !TokenEligibility.CanIssueTokensFor(user))
        {
            current.Revoke(now);
            await refreshTokenStore.SaveChangesAsync(ct);
            return null;
        }

        var replacement = refreshTokenFactory.Create(now);
        var replacementEntity = new RefreshToken(user.Id, replacement.Hash, replacement.ExpiresAt);
        if (!await refreshTokenStore.TryRotateAsync(current, replacementEntity, now, ct))
        {
            // A conditional update lost a race with another use of this token. Treat it as
            // a replay and invalidate the user's still-active refresh sessions.
            await refreshTokenStore.RevokeActiveForUserAsync(current.UserId, now, ct);
            return null;
        }

        var accessToken = tokenIssuer.Issue(user);
        return new AuthSession(
            new AuthResponse(accessToken.Value, accessToken.ExpiresAt, AppUserResponse.From(user)),
            replacement.Value,
            replacement.ExpiresAt);
    }
}

public record RevokeRefreshTokenCommand(string? RefreshToken) : IRequest;

public class RevokeRefreshTokenHandler(
    IRefreshTokenStore refreshTokenStore,
    IRefreshTokenFactory refreshTokenFactory,
    TimeProvider timeProvider) : IRequestHandler<RevokeRefreshTokenCommand>
{
    public async Task Handle(RevokeRefreshTokenCommand command, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken))
            return;

        var refreshToken = await refreshTokenStore.FindByTokenHashAsync(
            refreshTokenFactory.Hash(command.RefreshToken), ct);
        var now = timeProvider.GetUtcNow();
        if (refreshToken is null || !refreshToken.IsActive(now))
            return;

        refreshToken.Revoke(now);
        await refreshTokenStore.SaveChangesAsync(ct);
    }
}

internal static class TokenEligibility
{
    public static bool CanIssueTokensFor(AppUser user)
    {
        try
        {
            AppRoles.Normalize(user.Role);
            return true;
        }
        catch (ArgumentOutOfRangeException)
        {
            return false;
        }
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
