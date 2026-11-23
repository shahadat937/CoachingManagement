using Coaching.BuildingBlocks;
using Coaching.BuildingBlocks.Messaging;
using Coaching.BuildingBlocks.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.Exams.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<ExamsDbContext>(o => o.UseNpgsql(config.GetConnectionString("Default")));
        services.AddScoped<DbContext>(sp => sp.GetRequiredService<ExamsDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddRabbitMqMessaging(config, queuePrefix: "exams");
        return services;
    }
}
