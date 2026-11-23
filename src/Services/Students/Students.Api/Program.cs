using Coaching.Students.Application;
using Coaching.Students.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddApplication().AddInfrastructure(builder.Configuration);

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
app.MapHealthChecks("/health");

// Dev convenience. Replace with EF Core migrations before production.
using (var scope = app.Services.CreateScope())
    scope.ServiceProvider.GetRequiredService<StudentsDbContext>().Database.EnsureCreated();

app.Run();
