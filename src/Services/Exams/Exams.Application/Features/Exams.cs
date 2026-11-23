using Coaching.BuildingBlocks;
using Coaching.Exams.Domain;
using MediatR;

namespace Coaching.Exams.Application.Features;

public record ListExamsQuery : IRequest<IReadOnlyList<Exam>>;

public class ListExamsHandler(IRepository<Exam> repo) : IRequestHandler<ListExamsQuery, IReadOnlyList<Exam>>
{
    public Task<IReadOnlyList<Exam>> Handle(ListExamsQuery q, CancellationToken ct) => repo.ListAsync(ct);
}

// TODO: replace the entity payload with a dedicated DTO + FluentValidation validator.
public record CreateExamCommand(Exam Item) : IRequest<Guid>;

public class CreateExamHandler(IRepository<Exam> repo) : IRequestHandler<CreateExamCommand, Guid>
{
    public async Task<Guid> Handle(CreateExamCommand c, CancellationToken ct)
    {
        await repo.AddAsync(c.Item, ct);
        await repo.SaveChangesAsync(ct);
        return c.Item.Id;
    }
}
