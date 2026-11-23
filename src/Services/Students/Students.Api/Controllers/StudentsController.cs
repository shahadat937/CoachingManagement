using Coaching.BuildingBlocks.Security;
using Coaching.Students.Application.Features;
using Coaching.Students.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Students.Api.Controllers;

[ApiController]
[Route("api/students")]
[Authorize(Policy = AuthorizationPolicies.StudentManagement)]
public class StudentsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await sender.Send(new ListStudentsQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create(Student item, CancellationToken ct)
    {
        var id = await sender.Send(new CreateStudentCommand(item), ct);
        return Created(string.Empty, new { id });
    }
}
