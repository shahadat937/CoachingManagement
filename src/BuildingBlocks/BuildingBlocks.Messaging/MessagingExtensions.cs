using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.BuildingBlocks.Messaging;

public class MassTransitEventBus(IPublishEndpoint publisher) : IEventBus
{
    public Task PublishAsync<T>(T @event, CancellationToken ct = default) where T : class => publisher.Publish(@event, ct);
}

public static class MessagingExtensions
{
    public static IServiceCollection AddRabbitMqMessaging(this IServiceCollection services, IConfiguration config,
        Action<IBusRegistrationConfigurator>? configure = null, string? queuePrefix = null)
    {
        services.AddMassTransit(x =>
        {
            configure?.Invoke(x);
            x.UsingRabbitMq((ctx, cfg) =>
            {
                cfg.Host(config["RabbitMq:Host"] ?? "localhost", "/", h =>
                {
                    h.Username(config["RabbitMq:User"] ?? "guest");
                    h.Password(config["RabbitMq:Password"] ?? "guest");
                });
                cfg.ConfigureEndpoints(ctx, new KebabCaseEndpointNameFormatter(queuePrefix, false));
            });
        });
        services.AddScoped<IEventBus, MassTransitEventBus>();
        return services;
    }
}
