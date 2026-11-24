using Coaching.Academic.Application.Features;
using Coaching.BuildingBlocks.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Academic.Api.Controllers;

[ApiController]
[Route("api/academic/batches")]
public sealed class BatchesController(ISender sender) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AcademicRead)]
    public async Task<IActionResult> List([FromQuery] int? classLevel, CancellationToken ct)
    {
        try
        {
            return Ok(await sender.Send(new ListBatchesQuery(classLevel), ct));
        }
        catch (AcademicInputException exception)
        {
            return ValidationProblem(new ValidationProblemDetails(
                new Dictionary<string, string[]> { [exception.Field] = [exception.Message] }));
        }
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AcademicWrite)]
    public async Task<IActionResult> Create(CreateBatchRequest request, CancellationToken ct)
    {
        try
        {
            var batch = await sender.Send(new CreateBatchCommand(request.ClassLevel, request.Name, request.Code), ct);
            return Created("/api/academic/batches", batch);
        }
        catch (AcademicInputException exception)
        {
            return ValidationProblem(new ValidationProblemDetails(
                new Dictionary<string, string[]> { [exception.Field] = [exception.Message] }));
        }
        catch (AcademicConflictException exception)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Academic record already exists",
                Detail = exception.Message,
                Status = StatusCodes.Status409Conflict,
                Extensions = { ["field"] = exception.Field },
            });
        }
    }
}

public sealed record CreateBatchRequest(int ClassLevel, string? Name, string? Code);
