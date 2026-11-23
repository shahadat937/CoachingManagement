using Coaching.Attendance.Application;
using Coaching.Attendance.Infrastructure.Messaging;
using Coaching.BuildingBlocks.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.Attendance.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AttendanceDbContext>(o => o.UseNpgsql(config.GetConnectionString("Default")));
        services.AddScoped<IAttendanceStore, AttendanceStore>();
        services.AddRabbitMqMessaging(config, x =>
        {
            x.AddConsumer<DevicePunchReceivedConsumer>();
            x.AddConsumer<StudentEnrolledConsumer>();
        }, queuePrefix: "attendance");
        return services;
    }
}
