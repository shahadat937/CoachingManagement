using Coaching.Attendance.Application;
using Coaching.Attendance.Infrastructure;
using Coaching.BuildingBlocks.Security;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddCoachingJwtAuthenticationAndAuthorization(builder.Configuration, builder.Environment);
builder.Services.AddApplication().AddInfrastructure(builder.Configuration);

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

// Dev convenience. Replace with EF Core migrations before production.
using (var scope = app.Services.CreateScope())
    scope.ServiceProvider.GetRequiredService<AttendanceDbContext>().Database.EnsureCreated();

app.Run();
