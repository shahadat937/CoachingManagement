using Coaching.BuildingBlocks.Messaging;
using Coaching.Devices.Application;
using Coaching.Devices.Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;

namespace Coaching.Devices.Infrastructure;

public class MongoDeviceStore(IMongoDatabase db) : IDeviceStore
{
    private IMongoCollection<Device> Devices => db.GetCollection<Device>("devices");
    private IMongoCollection<DevicePunch> Punches => db.GetCollection<DevicePunch>("punches");

    public async Task<Device?> GetBySerialAsync(string serial, CancellationToken ct) =>
        await Devices.Find(x => x.Serial == serial).FirstOrDefaultAsync(ct);
    public async Task<IReadOnlyList<Device>> ListAsync(CancellationToken ct) => await Devices.Find(_ => true).ToListAsync(ct);
    public Task AddAsync(Device d, CancellationToken ct) => Devices.InsertOneAsync(d, cancellationToken: ct);
    public Task TouchAsync(string serial, DateTimeOffset seenAt, CancellationToken ct) =>
        Devices.UpdateOneAsync(x => x.Serial == serial, Builders<Device>.Update.Set(x => x.LastSeenAt, seenAt), cancellationToken: ct);
    public Task AddPunchesAsync(IEnumerable<DevicePunch> punches, CancellationToken ct) =>
        Punches.InsertManyAsync(punches, cancellationToken: ct);
}

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        BsonSerializer.TryRegisterSerializer(new GuidSerializer(GuidRepresentation.Standard));
        BsonSerializer.TryRegisterSerializer(new DateTimeOffsetSerializer(BsonType.String));
        services.AddSingleton<IMongoClient>(_ => new MongoClient(config.GetConnectionString("Mongo")));
        services.AddSingleton(sp => sp.GetRequiredService<IMongoClient>().GetDatabase(config["Mongo:Database"] ?? "devices_db"));
        services.AddSingleton<IDeviceStore, MongoDeviceStore>();
        services.AddRabbitMqMessaging(config, queuePrefix: "devices");
        return services;
    }
}
