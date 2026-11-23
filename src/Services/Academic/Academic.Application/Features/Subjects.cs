using Coaching.BuildingBlocks;
using Coaching.Academic.Domain;
using MediatR;

namespace Coaching.Academic.Application.Features;

public record ListSubjectsQuery : IRequest<IReadOnlyList<Subject>>;

public class ListSubjectsHandler(IRepository<Subject> repo) : IRequestHandler<ListSubjectsQuery, IReadOnlyList<Subject>>
{
    public Task<IReadOnlyList<Subject>> Handle(ListSubjectsQuery q, CancellationToken ct) => repo.ListAsync(ct);
}

// TODO: replace the entity payload with a dedicated DTO + FluentValidation validator.
public record CreateSubjectCommand(Subject Item) : IRequest<Guid>;

public class CreateSubjectHandler(IRepository<Subject> repo) : IRequestHandler<CreateSubjectCommand, Guid>
{
    public async Task<Guid> Handle(CreateSubjectCommand c, CancellationToken ct)
    {
        await repo.AddAsync(c.Item, ct);
        await repo.SaveChangesAsync(ct);
        return c.Item.Id;
    }
}
