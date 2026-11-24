using Coaching.Attendance.Application.Features;
using Coaching.BuildingBlocks.Contracts;
using MassTransit;
using MediatR;

namespace Coaching.Attendance.Infrastructure.Messaging;

public class DevicePunchReceivedConsumer(ISender sender) : IConsumer<DevicePunchReceived>
{
    public Task Consume(ConsumeContext<DevicePunchReceived> ctx) =>
        sender.Send(new RecordDevicePunchCommand(ctx.Message.DeviceUserId, ctx.Message.RoomCode, ctx.Message.PunchedAt, ctx.Message.DeviceSerial), ctx.CancellationToken);
}

public class StudentEnrolledConsumer(ISender sender) : IConsumer<StudentEnrolled>
{
    public Task Consume(ConsumeContext<StudentEnrolled> ctx) =>
        sender.Send(new UpsertStudentRefCommand(
            ctx.Message.StudentId,
            ctx.Message.FullName,
            ctx.Message.ClassLevel,
            ctx.Message.DeviceUserId,
            ctx.Message.IsActive), ctx.CancellationToken);
}
