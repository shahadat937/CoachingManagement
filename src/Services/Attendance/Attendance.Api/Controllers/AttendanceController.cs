using Coaching.Attendance.Application.Features;
using Coaching.Attendance.Domain;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Attendance.Api.Controllers;

public record MarkRequest(AttendanceStatus Status);

[ApiController]
[Route("api/attendance")]
public class AttendanceController(ISender sender) : ControllerBase
{
    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession(CreateSessionCommand cmd, CancellationToken ct) =>
        Created(string.Empty, new { id = await sender.Send(cmd, ct) });

    [HttpGet("sessions/{sessionId:guid}/records")]
    public async Task<IActionResult> Records(Guid sessionId, CancellationToken ct) =>
        Ok(await sender.Send(new GetSessionAttendanceQuery(sessionId), ct));

    [HttpPut("sessions/{sessionId:guid}/students/{studentId:guid}")]
    public async Task<IActionResult> Mark(Guid sessionId, Guid studentId, MarkRequest body, CancellationToken ct)
    {
        await sender.Send(new MarkAttendanceCommand(sessionId, studentId, body.Status), ct);
        return NoContent();
    }
}
