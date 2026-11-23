using Coaching.BuildingBlocks;
using Coaching.BuildingBlocks.Messaging;
using Coaching.BuildingBlocks.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.Accounts.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AccountsDbContext>(o => o.UseNpgsql(config.GetConnectionString("Default")));
        services.AddScoped<DbContext>(sp => sp.GetRequiredService<AccountsDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddRabbitMqMessaging(config, queuePrefix: "accounts");
        return services;
    }
}
