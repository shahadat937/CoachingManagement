using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Coaching.BuildingBlocks.Security;
using Coaching.Identity.Application;
using Coaching.Identity.Application.Features;
using Coaching.Identity.Domain;
using Coaching.Identity.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace Coaching.Identity.Tests;

public class LoginHandlerTests
{
    [Fact]
    public async Task Valid_credentials_issue_a_token_and_return_safe_user_data()
    {
        var store = new InMemoryAppUserStore();
        var passwordHasher = new PasswordHasher<AppUser>();
        var user = new AppUser("teacher@example.test", "Maya Rahman", AppRoles.Teacher);
        user.SetPasswordHash(passwordHasher.HashPassword(user, "A-strong-password-2026"));
        await store.AddAsync(user);

        var tokenIssuer = new RecordingTokenIssuer();
        var refreshTokenStore = new InMemoryRefreshTokenStore();
        var refreshTokenFactory = new DeterministicRefreshTokenFactory();
        var handler = new LoginHandler(
            store,
            passwordHasher,
            tokenIssuer,
            refreshTokenStore,
            refreshTokenFactory,
            TestTime.Clock);

        var response = await handler.Handle(
            new LoginCommand("  TEACHER@example.test ", "A-strong-password-2026"),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal("issued-token", response.Response.AccessToken);
        Assert.Equal(user.Id, response.Response.User.Id);
        Assert.Equal(AppRoles.Teacher, response.Response.User.Role);
        Assert.Same(user, tokenIssuer.IssuedFor);

        var persistedRefreshToken = Assert.Single(refreshTokenStore.Tokens);
        Assert.Equal(user.Id, persistedRefreshToken.UserId);
        Assert.Equal(refreshTokenFactory.Hash(response.RefreshToken), persistedRefreshToken.TokenHash);
        Assert.NotEqual(response.RefreshToken, persistedRefreshToken.TokenHash);
    }

    [Fact]
    public async Task Invalid_credentials_do_not_issue_a_token()
    {
        var store = new InMemoryAppUserStore();
        var passwordHasher = new PasswordHasher<AppUser>();
        var user = new AppUser("teacher@example.test", "Maya Rahman", AppRoles.Teacher);
        user.SetPasswordHash(passwordHasher.HashPassword(user, "A-strong-password-2026"));
        await store.AddAsync(user);

        var tokenIssuer = new RecordingTokenIssuer();
        var handler = new LoginHandler(
            store,
            passwordHasher,
            tokenIssuer,
            new InMemoryRefreshTokenStore(),
            new DeterministicRefreshTokenFactory(),
            TestTime.Clock);

        var response = await handler.Handle(
            new LoginCommand("teacher@example.test", "not-the-password"),
            CancellationToken.None);

        Assert.Null(response);
        Assert.Null(tokenIssuer.IssuedFor);
    }
}

public class RefreshSessionHandlerTests
{
    [Fact]
    public async Task Valid_refresh_token_rotates_and_replaces_the_previous_token()
    {
        var user = new AppUser("admin@example.test", "Amina Rahman", AppRoles.Admin);
        user.SetPasswordHash("not-used-for-refresh");
        var users = new InMemoryAppUserStore();
        await users.AddAsync(user);
        var refreshTokens = new InMemoryRefreshTokenStore();
        var refreshFactory = new DeterministicRefreshTokenFactory();
        var original = refreshFactory.Create(TestTime.Clock.GetUtcNow());
        var current = new RefreshToken(user.Id, original.Hash, original.ExpiresAt);
        await refreshTokens.AddAsync(current);

        var handler = new RefreshSessionHandler(
            users,
            refreshTokens,
            refreshFactory,
            new RecordingTokenIssuer(),
            TestTime.Clock);

        var session = await handler.Handle(new RefreshSessionCommand(original.Value), CancellationToken.None);

        Assert.NotNull(session);
        Assert.False(current.IsActive(TestTime.Clock.GetUtcNow()));
        Assert.Equal(refreshFactory.Hash(session.RefreshToken), current.ReplacedByTokenHash);
        var replacement = Assert.Single(refreshTokens.Tokens, token => token.Id != current.Id);
        Assert.True(replacement.IsActive(TestTime.Clock.GetUtcNow()));
        Assert.Equal(user.Id, session.Response.User.Id);
    }

    [Fact]
    public async Task Replaying_a_rotated_refresh_token_revokes_the_active_user_sessions()
    {
        var user = new AppUser("admin@example.test", "Amina Rahman", AppRoles.Admin);
        user.SetPasswordHash("not-used-for-refresh");
        var users = new InMemoryAppUserStore();
        await users.AddAsync(user);
        var refreshTokens = new InMemoryRefreshTokenStore();
        var refreshFactory = new DeterministicRefreshTokenFactory();
        var original = refreshFactory.Create(TestTime.Clock.GetUtcNow());
        var current = new RefreshToken(user.Id, original.Hash, original.ExpiresAt);
        await refreshTokens.AddAsync(current);
        var handler = new RefreshSessionHandler(
            users,
            refreshTokens,
            refreshFactory,
            new RecordingTokenIssuer(),
            TestTime.Clock);

        var rotated = await handler.Handle(new RefreshSessionCommand(original.Value), CancellationToken.None);
        var replay = await handler.Handle(new RefreshSessionCommand(original.Value), CancellationToken.None);

        Assert.NotNull(rotated);
        Assert.Null(replay);
        Assert.All(refreshTokens.Tokens, token => Assert.False(token.IsActive(TestTime.Clock.GetUtcNow())));
    }

    [Fact]
    public async Task Logout_revokes_the_presented_active_refresh_token()
    {
        var user = new AppUser("admin@example.test", "Amina Rahman", AppRoles.Admin);
        user.SetPasswordHash("not-used-for-refresh");
        var refreshTokens = new InMemoryRefreshTokenStore();
        var refreshFactory = new DeterministicRefreshTokenFactory();
        var issued = refreshFactory.Create(TestTime.Clock.GetUtcNow());
        var current = new RefreshToken(user.Id, issued.Hash, issued.ExpiresAt);
        await refreshTokens.AddAsync(current);

        var handler = new RevokeRefreshTokenHandler(refreshTokens, refreshFactory, TestTime.Clock);
        await handler.Handle(new RevokeRefreshTokenCommand(issued.Value), CancellationToken.None);

        Assert.False(current.IsActive(TestTime.Clock.GetUtcNow()));
    }
}

public class JwtTokenIssuerTests
{
    [Fact]
    public void Issued_token_contains_the_authenticated_user_claims_and_valid_signature()
    {
        const string signingKey = "unit-test-signing-key-that-is-at-least-32-bytes";
        var options = Options.Create(new JwtOptions
        {
            Issuer = "Coaching.Tests",
            Audience = "Coaching.Tests.Web",
            SigningKey = signingKey,
            AccessTokenLifetimeMinutes = 15,
        });
        var user = new AppUser("admin@example.test", "Amina Rahman", AppRoles.Admin);
        user.SetPasswordHash("not-used-by-token-issuer");

        var issued = new JwtTokenIssuer(options).Issue(user);

        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
        var principal = handler.ValidateToken(issued.Value, new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
            ValidateIssuer = true,
            ValidIssuer = "Coaching.Tests",
            ValidateAudience = true,
            ValidAudience = "Coaching.Tests.Web",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            NameClaimType = JwtRegisteredClaimNames.Email,
            RoleClaimType = JwtClaimTypes.Role,
        }, out _);

        Assert.Equal(user.Id.ToString(), principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value);
        Assert.Equal(user.Email, principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value);
        Assert.Equal(user.FullName, principal.FindFirst(JwtRegisteredClaimNames.Name)?.Value);
        Assert.Equal(AppRoles.Admin, principal.FindFirst(JwtClaimTypes.Role)?.Value);
        Assert.True(issued.ExpiresAt > DateTimeOffset.UtcNow);
    }
}

internal sealed class InMemoryAppUserStore : IAppUserStore
{
    private readonly List<AppUser> users = [];

    public Task<AppUser?> FindByEmailAsync(string normalizedEmail, CancellationToken ct = default) =>
        Task.FromResult(users.SingleOrDefault(user => user.Email == normalizedEmail));

    public Task<AppUser?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        Task.FromResult(users.SingleOrDefault(user => user.Id == id));

    public Task<bool> HasRoleAsync(string role, CancellationToken ct = default) =>
        Task.FromResult(users.Any(user => user.Role == role));

    public Task<IReadOnlyList<AppUser>> ListAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<AppUser>>(users);

    public Task AddAsync(AppUser user, CancellationToken ct = default)
    {
        users.Add(user);
        return Task.CompletedTask;
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => Task.FromResult(1);
}

internal sealed class InMemoryRefreshTokenStore : IRefreshTokenStore
{
    private readonly List<RefreshToken> tokens = [];

    public IReadOnlyList<RefreshToken> Tokens => tokens;

    public Task<RefreshToken?> FindByTokenHashAsync(string tokenHash, CancellationToken ct = default) =>
        Task.FromResult(tokens.SingleOrDefault(token => token.TokenHash == tokenHash));

    public Task AddAsync(RefreshToken refreshToken, CancellationToken ct = default)
    {
        tokens.Add(refreshToken);
        return Task.CompletedTask;
    }

    public Task<bool> TryRotateAsync(
        RefreshToken current,
        RefreshToken replacement,
        DateTimeOffset revokedAt,
        CancellationToken ct = default)
    {
        var persisted = tokens.SingleOrDefault(token => token.Id == current.Id && token.TokenHash == current.TokenHash);
        if (persisted is null || !persisted.IsActive(revokedAt))
            return Task.FromResult(false);

        persisted.Revoke(revokedAt, replacement.TokenHash);
        tokens.Add(replacement);
        return Task.FromResult(true);
    }

    public Task RevokeActiveForUserAsync(Guid userId, DateTimeOffset revokedAt, CancellationToken ct = default)
    {
        foreach (var token in tokens.Where(token => token.UserId == userId && token.IsActive(revokedAt)))
            token.Revoke(revokedAt);

        return Task.CompletedTask;
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => Task.FromResult(1);
}

internal sealed class DeterministicRefreshTokenFactory : IRefreshTokenFactory
{
    private int issued;

    public IssuedRefreshToken Create(DateTimeOffset now)
    {
        var value = $"refresh-token-{++issued}";
        return new IssuedRefreshToken(value, Hash(value), now.AddDays(7));
    }

    public string Hash(string token) => $"hash-{token}";
}

internal sealed class RecordingTokenIssuer : ITokenIssuer
{
    public AppUser? IssuedFor { get; private set; }

    public IssuedAccessToken Issue(AppUser user)
    {
        IssuedFor = user;
        return new IssuedAccessToken("issued-token", DateTimeOffset.UtcNow.AddHours(1));
    }
}

internal sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => now;
}

file static class TestTime
{
    public static readonly TimeProvider Clock = new FixedTimeProvider(new DateTimeOffset(2026, 11, 23, 12, 0, 0, TimeSpan.Zero));
}
