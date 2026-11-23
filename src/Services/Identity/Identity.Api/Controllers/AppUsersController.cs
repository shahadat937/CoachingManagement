using Coaching.Identity.Application.Features;
using Coaching.Identity.Domain;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Identity.Api.Controllers;

[ApiController]
[Route("api/users")]
public class AppUsersController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await sender.Send(new ListAppUsersQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create(AppUser item, CancellationToken ct)
    {
        var id = await sender.Send(new CreateAppUserCommand(item), ct);
        return Created(string.Empty, new { id });
    }
}
