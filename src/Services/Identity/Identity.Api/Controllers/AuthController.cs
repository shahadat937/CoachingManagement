using Coaching.Identity.Application.Features;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace Coaching.Identity.Api.Controllers;

public sealed record LoginRequest(string? Email, string? Password);

[ApiController]
[Route("api/auth")]
public class AuthController(ISender sender, IHostEnvironment environment) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var session = await sender.Send(new LoginCommand(request.Email, request.Password), ct);
        if (session is null)
            return Unauthorized();

        RefreshTokenCookie.Append(Response, session.RefreshToken, session.RefreshTokenExpiresAt, environment);
        return Ok(session.Response);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(CancellationToken ct)
    {
        var session = await sender.Send(new RefreshSessionCommand(Request.Cookies[RefreshTokenCookie.Name]), ct);
        if (session is null)
        {
            RefreshTokenCookie.Clear(Response, environment);
            return Unauthorized();
        }

        RefreshTokenCookie.Append(Response, session.RefreshToken, session.RefreshTokenExpiresAt, environment);
        return Ok(session.Response);
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        await sender.Send(new RevokeRefreshTokenCommand(Request.Cookies[RefreshTokenCookie.Name]), ct);

        RefreshTokenCookie.Clear(Response, environment);
        return NoContent();
    }
}
