using Coaching.BuildingBlocks;
using Coaching.Identity.Domain;
using MediatR;

namespace Coaching.Identity.Application.Features;

public record ListAppUsersQuery : IRequest<IReadOnlyList<AppUser>>;

public class ListAppUsersHandler(IRepository<AppUser> repo) : IRequestHandler<ListAppUsersQuery, IReadOnlyList<AppUser>>
{
    public Task<IReadOnlyList<AppUser>> Handle(ListAppUsersQuery q, CancellationToken ct) => repo.ListAsync(ct);
}

// TODO: replace the entity payload with a dedicated DTO + FluentValidation validator.
public record CreateAppUserCommand(AppUser Item) : IRequest<Guid>;

public class CreateAppUserHandler(IRepository<AppUser> repo) : IRequestHandler<CreateAppUserCommand, Guid>
{
    public async Task<Guid> Handle(CreateAppUserCommand c, CancellationToken ct)
    {
        await repo.AddAsync(c.Item, ct);
        await repo.SaveChangesAsync(ct);
        return c.Item.Id;
    }
}
