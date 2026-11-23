using Coaching.BuildingBlocks;
using Coaching.Accounts.Domain;
using MediatR;

namespace Coaching.Accounts.Application.Features;

public record ListFeeInvoicesQuery : IRequest<IReadOnlyList<FeeInvoice>>;

public class ListFeeInvoicesHandler(IRepository<FeeInvoice> repo) : IRequestHandler<ListFeeInvoicesQuery, IReadOnlyList<FeeInvoice>>
{
    public Task<IReadOnlyList<FeeInvoice>> Handle(ListFeeInvoicesQuery q, CancellationToken ct) => repo.ListAsync(ct);
}

// TODO: replace the entity payload with a dedicated DTO + FluentValidation validator.
public record CreateFeeInvoiceCommand(FeeInvoice Item) : IRequest<Guid>;

public class CreateFeeInvoiceHandler(IRepository<FeeInvoice> repo) : IRequestHandler<CreateFeeInvoiceCommand, Guid>
{
    public async Task<Guid> Handle(CreateFeeInvoiceCommand c, CancellationToken ct)
    {
        await repo.AddAsync(c.Item, ct);
        await repo.SaveChangesAsync(ct);
        return c.Item.Id;
    }
}
