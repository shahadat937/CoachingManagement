using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace Coaching.BuildingBlocks.Security;

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string Accountant = "Accountant";
    public const string Teacher = "Teacher";
    public const string Student = "Student";
    public const string Guardian = "Guardian";

    private static readonly string[] KnownRoles = [Admin, Accountant, Teacher, Student, Guardian];

    public static IReadOnlyList<string> All => KnownRoles;

    public static string Normalize(string? role)
    {
        var normalized = KnownRoles.FirstOrDefault(candidate =>
            string.Equals(candidate, role?.Trim(), StringComparison.OrdinalIgnoreCase));

        return normalized ?? throw new ArgumentOutOfRangeException(
            nameof(role),
            $"Role must be one of: {string.Join(", ", KnownRoles)}.");
    }
}

public static class AuthorizationPolicies
{
    public const string UserManagement = nameof(UserManagement);
    public const string AcademicRead = nameof(AcademicRead);
    public const string AcademicWrite = nameof(AcademicWrite);
    public const string StudentManagement = nameof(StudentManagement);
    public const string AttendanceManagement = nameof(AttendanceManagement);
    public const string DeviceManagement = nameof(DeviceManagement);
    public const string FinanceManagement = nameof(FinanceManagement);
    public const string ExamManagement = nameof(ExamManagement);
}

public static class JwtClaimTypes
{
    public const string Role = "role";
}

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public const string DevelopmentSigningKey = "development-only-change-this-signing-key-2026-11-23";

    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenLifetimeMinutes { get; set; } = 60;

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(Issuer))
            throw new InvalidOperationException("Jwt:Issuer must be configured.");
        if (string.IsNullOrWhiteSpace(Audience))
            throw new InvalidOperationException("Jwt:Audience must be configured.");
        if (string.IsNullOrWhiteSpace(SigningKey))
            throw new InvalidOperationException("Jwt:SigningKey must be configured.");
        if (Encoding.UTF8.GetByteCount(SigningKey) < 32)
            throw new InvalidOperationException("Jwt:SigningKey must contain at least 32 bytes.");
        if (AccessTokenLifetimeMinutes is < 1 or > 1440)
            throw new InvalidOperationException("Jwt:AccessTokenLifetimeMinutes must be between 1 and 1440.");
    }
}

public static class JwtAuthenticationExtensions
{
    public static IServiceCollection AddCoachingJwtAuthenticationAndAuthorization(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var jwt = new JwtOptions();
        configuration.GetSection(JwtOptions.SectionName).Bind(jwt);
        jwt.Validate();

        if (!environment.IsDevelopment() &&
            string.Equals(jwt.SigningKey, JwtOptions.DevelopmentSigningKey, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Jwt:SigningKey must be overridden with a secret outside the Development environment.");
        }

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateLifetime = true,
                    RequireExpirationTime = true,
                    RequireSignedTokens = true,
                    ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = "email",
                    RoleClaimType = JwtClaimTypes.Role,
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(AuthorizationPolicies.UserManagement,
                policy => policy.RequireRole(AppRoles.Admin));
            options.AddPolicy(AuthorizationPolicies.AcademicRead,
                policy => policy.RequireRole(AppRoles.Admin, AppRoles.Teacher));
            options.AddPolicy(AuthorizationPolicies.AcademicWrite,
                policy => policy.RequireRole(AppRoles.Admin));
            options.AddPolicy(AuthorizationPolicies.StudentManagement,
                policy => policy.RequireRole(AppRoles.Admin, AppRoles.Teacher));
            options.AddPolicy(AuthorizationPolicies.AttendanceManagement,
                policy => policy.RequireRole(AppRoles.Admin, AppRoles.Teacher));
            options.AddPolicy(AuthorizationPolicies.DeviceManagement,
                policy => policy.RequireRole(AppRoles.Admin));
            options.AddPolicy(AuthorizationPolicies.FinanceManagement,
                policy => policy.RequireRole(AppRoles.Admin, AppRoles.Accountant));
            options.AddPolicy(AuthorizationPolicies.ExamManagement,
                policy => policy.RequireRole(AppRoles.Admin, AppRoles.Teacher));
        });

        return services;
    }
}
