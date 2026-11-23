using Coaching.BuildingBlocks;
using Coaching.BuildingBlocks.Messaging;
using Coaching.BuildingBlocks.Persistence;
using Coaching.Students.Application;
using Coaching.Students.Infrastructure.Messaging;
using Coaching.Students.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.Students.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<StudentsDbContext>(o => o.UseNpgsql(config.GetConnectionString("Default")));
        services.AddScoped<DbContext>(sp => sp.GetRequiredService<StudentsDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IStudentStore, StudentStore>();
        services.AddScoped<IStudentEventOutbox, StudentEventOutbox>();
        services.AddHostedService<StudentEventOutboxDispatcher>();
        services.AddRabbitMqMessaging(config, queuePrefix: "students");
        return services;
    }
}
