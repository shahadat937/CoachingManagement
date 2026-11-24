using Coaching.Academic.Application.Features;
using Coaching.BuildingBlocks.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Academic.Api.Controllers;

[ApiController]
[Route("api/academic/classes")]
public sealed class AcademicClassesController(ISender sender) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AcademicRead)]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await sender.Send(new ListAcademicClassesQuery(), ct));
}
