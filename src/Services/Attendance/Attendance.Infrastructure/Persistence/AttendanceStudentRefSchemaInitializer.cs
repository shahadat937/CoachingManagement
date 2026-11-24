using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.Attendance.Infrastructure;

/// <summary>
/// Adds student activity state to development databases that predate soft
/// deactivation. Replace this compatibility step with EF Core migrations before
/// a production deployment.
/// </summary>
public static class AttendanceStudentRefSchemaInitializer
{
    public static void EnsureAttendanceStudentRefSchema(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AttendanceDbContext>();

        db.Database.ExecuteSqlRaw("""
            ALTER TABLE "Students"
            ADD COLUMN IF NOT EXISTS "IsActive" boolean NOT NULL DEFAULT TRUE;
            """);
    }
}
