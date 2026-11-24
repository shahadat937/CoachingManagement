using Coaching.BuildingBlocks;
using Coaching.BuildingBlocks.Contracts;
using Coaching.BuildingBlocks.Messaging;
using Coaching.Students.Application;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Coaching.Students.Infrastructure.Messaging;

public sealed class StudentEventOutbox(StudentsDbContext db) : IStudentEventOutbox
{
    public async Task EnqueueAsync(StudentEnrolled @event, CancellationToken ct = default)
    {
        await db.StudentOutbox.AddAsync(new StudentOutboxMessage
        {
            StudentId = @event.StudentId,
            FullName = @event.FullName,
            ClassLevel = @event.ClassLevel,
            DeviceUserId = @event.DeviceUserId,
            GuardianPhone = @event.GuardianPhone,
            IsActive = @event.IsActive,
        }, ct);
    }
}

/// <summary>
/// Publishes committed outbox messages. Marking a message after broker acknowledgement
/// deliberately gives at-least-once delivery; Attendance's projection upsert is idempotent.
/// </summary>
public sealed class StudentEventOutboxDispatcher(
    IServiceScopeFactory scopeFactory,
    ILogger<StudentEventOutboxDispatcher> logger) : BackgroundService
{
    private const int BatchSize = 50;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<StudentsDbContext>();
                var bus = scope.ServiceProvider.GetRequiredService<IEventBus>();
                var now = DateTimeOffset.UtcNow;
                var messages = await db.StudentOutbox
                    .Where(x => x.PublishedAt == null && (x.NextAttemptAt == null || x.NextAttemptAt <= now))
                    .OrderBy(x => x.OccurredAt)
                    .Take(BatchSize)
                    .ToListAsync(stoppingToken);

                foreach (var message in messages)
                {
                    try
                    {
                        await bus.PublishAsync(new StudentEnrolled(
                            message.StudentId, message.FullName, message.ClassLevel,
                            message.DeviceUserId, message.GuardianPhone, message.IsActive), stoppingToken);
                        message.PublishedAt = DateTimeOffset.UtcNow;
                        message.LastError = null;
                        message.NextAttemptAt = null;
                        await db.SaveChangesAsync(stoppingToken);
                    }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        message.Attempts++;
                        message.LastError = ex.Message[..Math.Min(ex.Message.Length, 1000)];
                        message.NextAttemptAt = DateTimeOffset.UtcNow.AddSeconds(BackoffSeconds(message.Attempts));
                        await db.SaveChangesAsync(stoppingToken);
                        logger.LogWarning(ex, "Could not publish StudentEnrolled outbox message {OutboxMessageId}; retrying later", message.Id);
                    }
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Student event outbox polling failed");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private static int BackoffSeconds(int attempts) => (int)Math.Min(300, Math.Pow(2, Math.Min(attempts, 8)));
}
