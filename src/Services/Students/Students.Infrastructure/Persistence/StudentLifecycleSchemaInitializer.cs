using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.Students.Infrastructure;

/// <summary>
/// Adds soft-deactivation fields to development databases created before student
/// lifecycle state was introduced. Replace this compatibility step with EF Core
/// migrations before a production deployment.
/// </summary>
public static class StudentLifecycleSchemaInitializer
{
    public static void EnsureStudentLifecycleSchema(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<StudentsDbContext>();

        db.Database.ExecuteSqlRaw("""
            ALTER TABLE "Students"
            ADD COLUMN IF NOT EXISTS "IsActive" boolean NOT NULL DEFAULT TRUE;
            """);
        db.Database.ExecuteSqlRaw("""
            ALTER TABLE "Students"
            ADD COLUMN IF NOT EXISTS "DeactivatedAt" timestamp with time zone NULL;
            """);
    }
}
