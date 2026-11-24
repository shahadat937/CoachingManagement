using Coaching.BuildingBlocks.Security;
using Coaching.Academic.Application.Features;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Academic.Api.Controllers;

[ApiController]
[Route("api/academic/subjects")]
[Route("api/subjects")]
public class SubjectsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AcademicRead)]
    public async Task<IActionResult> List([FromQuery] int? classLevel, CancellationToken ct)
    {
        try
        {
            return Ok(await sender.Send(new ListSubjectsQuery(classLevel), ct));
        }
        catch (AcademicInputException exception)
        {
            return AcademicValidationProblem(exception);
        }
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AcademicWrite)]
    public async Task<IActionResult> Create(CreateSubjectRequest request, CancellationToken ct)
    {
        try
        {
            var subject = await sender.Send(new CreateSubjectCommand(request.ClassLevel, request.Name, request.Code), ct);
            return Created("/api/academic/subjects", subject);
        }
        catch (AcademicInputException exception)
        {
            return AcademicValidationProblem(exception);
        }
        catch (AcademicConflictException exception)
        {
            return AcademicConflictProblem(exception);
        }
    }

    private IActionResult AcademicValidationProblem(AcademicInputException exception) =>
        ValidationProblem(new ValidationProblemDetails(
            new Dictionary<string, string[]> { [exception.Field] = [exception.Message] }));

    private IActionResult AcademicConflictProblem(AcademicConflictException exception) =>
        Conflict(new ProblemDetails
        {
            Title = "Academic record already exists",
            Detail = exception.Message,
            Status = StatusCodes.Status409Conflict,
            Extensions = { ["field"] = exception.Field },
        });
}

public sealed record CreateSubjectRequest(int ClassLevel, string? Name, string? Code);
