using Coaching.BuildingBlocks.Security;
using Coaching.Identity.Application;
using Coaching.Identity.Application.Features;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Coaching.Identity.Infrastructure;

public sealed class BootstrapAdminOptions
{
    public const string SectionName = "BootstrapAdmin";

    public string? Email { get; set; }
    public string? FullName { get; set; }
    public string? Password { get; set; }

    public bool HasAnyValue =>
        !string.IsNullOrWhiteSpace(Email) ||
        !string.IsNullOrWhiteSpace(FullName) ||
        !string.IsNullOrWhiteSpace(Password);

    public bool IsComplete =>
        !string.IsNullOrWhiteSpace(Email) &&
        !string.IsNullOrWhiteSpace(FullName) &&
        !string.IsNullOrWhiteSpace(Password);
}

public static class BootstrapAdminSeeder
{
    public static async Task SeedBootstrapAdminAsync(
        this IServiceProvider services,
        IConfiguration configuration,
        CancellationToken ct = default)
    {
        var bootstrap = new BootstrapAdminOptions();
        configuration.GetSection(BootstrapAdminOptions.SectionName).Bind(bootstrap);

        if (!bootstrap.HasAnyValue)
            return;
        if (!bootstrap.IsComplete)
            throw new InvalidOperationException(
                "BootstrapAdmin requires Email, FullName, and Password when any bootstrap setting is supplied.");

        using var scope = services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<IAppUserStore>();
        if (await store.HasRoleAsync(AppRoles.Admin, ct))
            return;

        var sender = scope.ServiceProvider.GetRequiredService<ISender>();
        var user = await sender.Send(
            new CreateAppUserCommand(bootstrap.Email, bootstrap.FullName, AppRoles.Admin, bootstrap.Password),
            ct);

        scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger("BootstrapAdminSeeder")
            .LogInformation("Created configured bootstrap administrator {Email}.", user.Email);
    }
}
