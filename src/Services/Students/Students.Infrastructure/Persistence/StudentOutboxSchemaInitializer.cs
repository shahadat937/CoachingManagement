using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.Students.Infrastructure;

/// <summary>
/// Adds the student-event outbox to existing development databases that were
/// created before the outbox was introduced. Replace this compatibility step
/// with EF Core migrations before a production deployment.
/// </summary>
public static class StudentOutboxSchemaInitializer
{
    public static void EnsureStudentOutboxSchema(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<StudentsDbContext>();

        db.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS "StudentOutbox" (
                "Id" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "FullName" character varying(256) NOT NULL,
                "ClassLevel" integer NOT NULL,
                "DeviceUserId" text NULL,
                "GuardianPhone" character varying(64) NOT NULL,
                "OccurredAt" timestamp with time zone NOT NULL,
                "PublishedAt" timestamp with time zone NULL,
                "Attempts" integer NOT NULL,
                "NextAttemptAt" timestamp with time zone NULL,
                "LastError" character varying(1000) NULL,
                CONSTRAINT "PK_StudentOutbox" PRIMARY KEY ("Id")
            );
            """);
        db.Database.ExecuteSqlRaw("""
            CREATE INDEX IF NOT EXISTS "IX_StudentOutbox_PublishedAt_NextAttemptAt_OccurredAt"
            ON "StudentOutbox" ("PublishedAt", "NextAttemptAt", "OccurredAt");
            """);
    }
}
