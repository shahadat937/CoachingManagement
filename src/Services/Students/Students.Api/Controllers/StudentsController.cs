using Coaching.BuildingBlocks.Security;
using Coaching.Students.Application;
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

public sealed record UpdateStudentRequest(
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
    public async Task<IActionResult> List([FromQuery] bool isActive = true, CancellationToken ct = default) =>
        Ok(await sender.Send(new ListStudentsQuery(isActive), ct));

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

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateStudentRequest request, CancellationToken ct)
    {
        try
        {
            var student = await sender.Send(new UpdateStudentCommand(
                id,
                request.StudentNo,
                request.FullName,
                request.ClassLevel,
                request.GuardianPhone,
                request.DeviceUserId), ct);
            return student is null ? NotFound() : Ok(student);
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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new DeactivateStudentCommand(id), ct);
        return result is null ? NotFound() : NoContent();
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new ActivateStudentCommand(id), ct);
        return result is null ? NotFound() : NoContent();
    }

    [HttpPost("{id:guid}/photo")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(StudentPhotoUploadValidation.MaxRequestBytes)]
    public async Task<IActionResult> UploadPhoto(Guid id, [FromForm] IFormFile? photo, CancellationToken ct)
    {
        if (photo is null)
            return PhotoValidationProblem("Choose a photo to upload.");

        if (photo.Length > StudentPhotoUploadValidation.MaxPhotoBytes)
            return PhotoTooLargeProblem();

        try
        {
            await using var input = photo.OpenReadStream();
            await using var output = new MemoryStream((int)photo.Length);
            await input.CopyToAsync(output, ct);

            var metadata = await sender.Send(
                new UploadStudentPhotoCommand(id, photo.ContentType, output.ToArray()),
                ct);
            return metadata is null ? NotFound() : Ok(metadata);
        }
        catch (StudentPhotoValidationException exception)
        {
            return PhotoValidationProblem(exception.Message);
        }
        catch (StudentPhotoSizeLimitExceededException)
        {
            return PhotoTooLargeProblem();
        }
        catch (InvalidDataException)
        {
            return PhotoTooLargeProblem();
        }
    }

    [HttpGet("{id:guid}/photo")]
    [Produces("image/jpeg", "image/png", "image/webp")]
    public async Task<IActionResult> GetPhoto(Guid id, CancellationToken ct)
    {
        var photo = await sender.Send(new GetStudentPhotoQuery(id), ct);
        if (photo is null)
            return NotFound();

        Response.Headers.CacheControl = "private, no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(photo.Bytes, photo.Metadata.ContentType);
    }

    private IActionResult PhotoValidationProblem(string message) =>
        ValidationProblem(new ValidationProblemDetails(
            new Dictionary<string, string[]> { ["photo"] = [message] }));

    private IActionResult PhotoTooLargeProblem() =>
        StatusCode(StatusCodes.Status413PayloadTooLarge, new ProblemDetails
        {
            Title = "Student photo is too large",
            Detail = $"A student photo must be {StudentPhotoUploadValidation.MaxPhotoBytes / (1024 * 1024)} MiB or smaller.",
            Status = StatusCodes.Status413PayloadTooLarge,
        });
}
