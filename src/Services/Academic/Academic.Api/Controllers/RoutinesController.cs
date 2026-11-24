using Coaching.Academic.Application.Features;
using Coaching.BuildingBlocks.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Academic.Api.Controllers;

[ApiController]
[Route("api/academic/routines")]
public sealed class RoutinesController(ISender sender) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AcademicRead)]
    public async Task<IActionResult> List([FromQuery] Guid batchId, CancellationToken ct)
    {
        try
        {
            return Ok(await sender.Send(new ListBatchRoutineQuery(batchId), ct));
        }
        catch (AcademicInputException exception)
        {
            return AcademicValidationProblem(exception);
        }
        catch (AcademicNotFoundException exception)
        {
            return AcademicNotFoundProblem(exception);
        }
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AcademicWrite)]
    public async Task<IActionResult> Create(RoutineRequest request, CancellationToken ct)
    {
        try
        {
            var routine = await sender.Send(new CreateBatchRoutineCommand(
                request.BatchId,
                request.SubjectId,
                request.DayOfWeek,
                request.StartTime,
                request.EndTime,
                request.RoomCode), ct);
            return Created($"/api/academic/routines/{routine.Id}", routine);
        }
        catch (AcademicInputException exception)
        {
            return AcademicValidationProblem(exception);
        }
        catch (AcademicConflictException exception)
        {
            return AcademicConflictProblem(exception);
        }
        catch (AcademicNotFoundException exception)
        {
            return AcademicNotFoundProblem(exception);
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AcademicWrite)]
    public async Task<IActionResult> Update(Guid id, RoutineRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await sender.Send(new UpdateBatchRoutineCommand(
                id,
                request.BatchId,
                request.SubjectId,
                request.DayOfWeek,
                request.StartTime,
                request.EndTime,
                request.RoomCode), ct));
        }
        catch (AcademicInputException exception)
        {
            return AcademicValidationProblem(exception);
        }
        catch (AcademicConflictException exception)
        {
            return AcademicConflictProblem(exception);
        }
        catch (AcademicNotFoundException exception)
        {
            return AcademicNotFoundProblem(exception);
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AcademicWrite)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await sender.Send(new DeleteBatchRoutineCommand(id), ct);
            return NoContent();
        }
        catch (AcademicInputException exception)
        {
            return AcademicValidationProblem(exception);
        }
        catch (AcademicNotFoundException exception)
        {
            return AcademicNotFoundProblem(exception);
        }
    }

    private IActionResult AcademicValidationProblem(AcademicInputException exception) =>
        ValidationProblem(new ValidationProblemDetails(
            new Dictionary<string, string[]> { [exception.Field] = [exception.Message] }));

    private IActionResult AcademicConflictProblem(AcademicConflictException exception) =>
        Conflict(new ProblemDetails
        {
            Title = "Routine time conflicts with an existing lesson",
            Detail = exception.Message,
            Status = StatusCodes.Status409Conflict,
            Extensions = { ["field"] = exception.Field },
        });

    private IActionResult AcademicNotFoundProblem(AcademicNotFoundException exception) =>
        NotFound(new ProblemDetails
        {
            Title = "Academic record was not found",
            Detail = exception.Message,
            Status = StatusCodes.Status404NotFound,
        });
}

public sealed record RoutineRequest(
    Guid BatchId,
    Guid SubjectId,
    int DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? RoomCode);
