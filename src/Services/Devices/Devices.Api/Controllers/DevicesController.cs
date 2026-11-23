using Coaching.Devices.Application.Features;
using Coaching.Devices.Domain;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Coaching.Devices.Api.Controllers;

public record RegisterDeviceRequest(string Serial, string Name, string RoomCode, DeviceType Type);
public record PunchBatch(IReadOnlyList<PunchItem> Punches);

[ApiController]
[Route("api/devices")]
public class DevicesController(ISender sender) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> List(CancellationToken ct) => Ok(await sender.Send(new ListDevicesQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Register(RegisterDeviceRequest r, CancellationToken ct) =>
        Created(string.Empty, new { apiKey = await sender.Send(new RegisterDeviceCommand(r.Serial, r.Name, r.RoomCode, r.Type), ct) });

    /// <summary>Called by the device (or an on-prem bridge for ZKTeco/ADMS-style devices). Auth: X-Device-Key header.</summary>
    [HttpPost("{serial}/punches")]
    public async Task<IActionResult> Punches(string serial, [FromHeader(Name = "X-Device-Key")] string key, PunchBatch batch, CancellationToken ct)
    {
        try { return Ok(new { accepted = await sender.Send(new IngestPunchesCommand(serial, key, batch.Punches), ct) }); }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }
}
