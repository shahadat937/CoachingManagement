using Coaching.BuildingBlocks.Security;
using Coaching.Students.Application.Features;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Students.Api.Controllers;

public sealed record CreateStudentRequest(
    string? StudentNo,
    string? FullName,
    int ClassLevel,
    string? GuardianPhone,
    string? DeviceUserId);

[ApiController]
[Route("api/students")]
[Authorize(Policy = AuthorizationPolicies.StudentManagement)]
public class StudentsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await sender.Send(new ListStudentsQuery(), ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var student = await sender.Send(new GetStudentQuery(id), ct);
        return student is null ? NotFound() : Ok(student);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateStudentRequest request, CancellationToken ct)
    {
        try
        {
            var student = await sender.Send(new CreateStudentCommand(
                request.StudentNo,
                request.FullName,
                request.ClassLevel,
                request.GuardianPhone,
                request.DeviceUserId), ct);
            return CreatedAtAction(nameof(Get), new { id = student.Id }, student);
        }
        catch (StudentInputException exception)
        {
            return ValidationProblem(new ValidationProblemDetails(
                new Dictionary<string, string[]> { [exception.Field] = [exception.Message] }));
        }
        catch (StudentConflictException exception)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Student already exists",
                Detail = exception.Message,
                Status = StatusCodes.Status409Conflict,
                Extensions = { ["field"] = exception.Field },
            });
        }
    }
}
