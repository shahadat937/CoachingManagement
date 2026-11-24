using Coaching.Academic.Application.Features;
using Coaching.BuildingBlocks.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Academic.Api.Controllers;

[ApiController]
[Route("api/academic/setup")]
public sealed class AcademicSetupController(ISender sender) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AcademicWrite)]
    public async Task<IActionResult> Save(CreateAcademicSetupRequest request, CancellationToken ct)
    {
        try
        {
            var setup = await sender.Send(
                new SaveAcademicSetupCommand(
                    request.ClassLevel,
                    request.Subjects?.Select(item => new AcademicSetupSubjectInput(item.Name, item.Code)).ToArray(),
                    request.Batches?.Select(item => new AcademicSetupBatchInput(item.Name, item.Code)).ToArray()),
                ct);

            return Created("/api/academic/setup", setup);
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

public sealed record CreateAcademicSetupRequest(
    int ClassLevel,
    IReadOnlyList<CreateAcademicSetupSubjectRequest>? Subjects,
    IReadOnlyList<CreateAcademicSetupBatchRequest>? Batches);

public sealed record CreateAcademicSetupSubjectRequest(string? Name, string? Code);
public sealed record CreateAcademicSetupBatchRequest(string? Name, string? Code);
