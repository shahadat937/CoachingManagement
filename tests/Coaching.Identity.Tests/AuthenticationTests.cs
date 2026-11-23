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
        var handler = new LoginHandler(store, passwordHasher, tokenIssuer);

        var response = await handler.Handle(
            new LoginCommand("  TEACHER@example.test ", "A-strong-password-2026"),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal("issued-token", response.AccessToken);
        Assert.Equal(user.Id, response.User.Id);
        Assert.Equal(AppRoles.Teacher, response.User.Role);
        Assert.Same(user, tokenIssuer.IssuedFor);
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
        var handler = new LoginHandler(store, passwordHasher, tokenIssuer);

        var response = await handler.Handle(
            new LoginCommand("teacher@example.test", "not-the-password"),
            CancellationToken.None);

        Assert.Null(response);
        Assert.Null(tokenIssuer.IssuedFor);
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

internal sealed class RecordingTokenIssuer : ITokenIssuer
{
    public AppUser? IssuedFor { get; private set; }

    public IssuedAccessToken Issue(AppUser user)
    {
        IssuedFor = user;
        return new IssuedAccessToken("issued-token", DateTimeOffset.UtcNow.AddHours(1));
    }
}
