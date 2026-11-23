using Coaching.BuildingBlocks.Security;
using Coaching.Identity.Application.Features;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Identity.Api.Controllers;

public sealed record CreateAppUserRequest(string? Email, string? FullName, string? Role, string? Password);

[ApiController]
[Route("api/users")]
[Authorize(Policy = AuthorizationPolicies.UserManagement)]
public class AppUsersController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await sender.Send(new ListAppUsersQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create(CreateAppUserRequest request, CancellationToken ct)
    {
        try
        {
            var user = await sender.Send(
                new CreateAppUserCommand(request.Email, request.FullName, request.Role, request.Password),
                ct);
            return Created(string.Empty, user);
        }
        catch (DuplicateEmailException exception)
        {
            return Conflict(new ProblemDetails { Title = "Email already exists", Detail = exception.Message });
        }
        catch (UserInputException exception)
        {
            return ValidationProblem(new ValidationProblemDetails(
                new Dictionary<string, string[]> { ["user"] = [exception.Message] }));
        }
    }
}
