using Coaching.Exams.Application.Features;
using Coaching.Exams.Domain;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Exams.Api.Controllers;

[ApiController]
[Route("api/exams")]
public class ExamsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await sender.Send(new ListExamsQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create(Exam item, CancellationToken ct)
    {
        var id = await sender.Send(new CreateExamCommand(item), ct);
        return Created(string.Empty, new { id });
    }
}
