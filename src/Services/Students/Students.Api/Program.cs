using Coaching.BuildingBlocks.Security;
using Coaching.Students.Application;
using Coaching.Students.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Paste a JWT access token. Swagger adds the Bearer prefix automatically.",
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer",
                },
            },
            Array.Empty<string>()
        },
    });
});
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
    scope.ServiceProvider.GetRequiredService<StudentsDbContext>().Database.EnsureCreated();

app.Services.EnsureStudentOutboxSchema();

app.Run();
