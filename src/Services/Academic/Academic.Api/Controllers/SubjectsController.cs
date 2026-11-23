using Coaching.BuildingBlocks.Security;
using Coaching.Academic.Application.Features;
using Coaching.Academic.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Academic.Api.Controllers;

[ApiController]
[Route("api/subjects")]
public class SubjectsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AcademicRead)]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await sender.Send(new ListSubjectsQuery(), ct));

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AcademicWrite)]
    public async Task<IActionResult> Create(Subject item, CancellationToken ct)
    {
        var id = await sender.Send(new CreateSubjectCommand(item), ct);
        return Created(string.Empty, new { id });
    }
}
