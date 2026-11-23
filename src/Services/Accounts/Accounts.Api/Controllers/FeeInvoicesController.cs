using Coaching.BuildingBlocks.Security;
using Coaching.Accounts.Application.Features;
using Coaching.Accounts.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Accounts.Api.Controllers;

[ApiController]
[Route("api/fee-invoices")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public class FeeInvoicesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await sender.Send(new ListFeeInvoicesQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create(FeeInvoice item, CancellationToken ct)
    {
        var id = await sender.Send(new CreateFeeInvoiceCommand(item), ct);
        return Created(string.Empty, new { id });
    }
}
