using Coaching.BuildingBlocks;
using Coaching.BuildingBlocks.Messaging;
using Coaching.BuildingBlocks.Persistence;
using Coaching.Identity.Application;
using Coaching.Identity.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.Identity.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<IdentityDbContext>(o => o.UseNpgsql(config.GetConnectionString("Default")));
        var refreshTokenOptions = new RefreshTokenOptions();
        config.GetSection(RefreshTokenOptions.SectionName).Bind(refreshTokenOptions);
        refreshTokenOptions.Validate();
        services.Configure<RefreshTokenOptions>(config.GetSection(RefreshTokenOptions.SectionName));
        services.AddScoped<DbContext>(sp => sp.GetRequiredService<IdentityDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IAppUserStore, AppUserStore>();
        services.AddScoped<IRefreshTokenStore, RefreshTokenStore>();
        services.AddScoped<ITokenIssuer, JwtTokenIssuer>();
        services.AddSingleton<IRefreshTokenFactory, RefreshTokenFactory>();
        services.AddRabbitMqMessaging(config, queuePrefix: "identity");
        return services;
    }
}
