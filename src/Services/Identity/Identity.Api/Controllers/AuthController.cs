using Coaching.Identity.Application.Features;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Identity.Api.Controllers;

public sealed record LoginRequest(string? Email, string? Password);

[ApiController]
[Route("api/auth")]
public class AuthController(ISender sender) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var response = await sender.Send(new LoginCommand(request.Email, request.Password), ct);
        return response is null ? Unauthorized() : Ok(response);
    }
}
