using Coaching.BuildingBlocks;
using Coaching.BuildingBlocks.Contracts;
using Coaching.Students.Domain;
using MediatR;

namespace Coaching.Students.Application.Features;

public record ListStudentsQuery : IRequest<IReadOnlyList<Student>>;

public class ListStudentsHandler(IRepository<Student> repo) : IRequestHandler<ListStudentsQuery, IReadOnlyList<Student>>
{
    public Task<IReadOnlyList<Student>> Handle(ListStudentsQuery q, CancellationToken ct) => repo.ListAsync(ct);
}

public record CreateStudentCommand(Student Item) : IRequest<Guid>;

public class CreateStudentHandler(IRepository<Student> repo, IStudentEventOutbox outbox) : IRequestHandler<CreateStudentCommand, Guid>
{
    public async Task<Guid> Handle(CreateStudentCommand c, CancellationToken ct)
    {
        if (c.Item.ClassLevel is < 1 or > 12) throw new ArgumentOutOfRangeException(nameof(c.Item.ClassLevel), "Class must be 1-12");
        await repo.AddAsync(c.Item, ct);
        await outbox.EnqueueAsync(new StudentEnrolled(c.Item.Id, c.Item.FullName, c.Item.ClassLevel, c.Item.DeviceUserId, c.Item.GuardianPhone), ct);
        await repo.SaveChangesAsync(ct);
        return c.Item.Id;
    }
}
