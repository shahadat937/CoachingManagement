using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.Students.Infrastructure;

/// <summary>
/// Adds the private student-photo table to existing development databases created
/// before photos were introduced. Replace this compatibility step with EF Core
/// migrations before a production deployment.
/// </summary>
public static class StudentPhotoSchemaInitializer
{
    public static void EnsureStudentPhotoSchema(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<StudentsDbContext>();

        db.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS "StudentPhotos" (
                "StudentId" uuid NOT NULL,
                "Content" bytea NOT NULL,
                "ContentType" character varying(32) NOT NULL,
                "SizeBytes" bigint NOT NULL,
                "UpdatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_StudentPhotos" PRIMARY KEY ("StudentId"),
                CONSTRAINT "FK_StudentPhotos_Students_StudentId"
                    FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE
            );
            """);
        db.Database.ExecuteSqlRaw("""
            ALTER TABLE "StudentPhotos"
            ADD COLUMN IF NOT EXISTS "SizeBytes" bigint NOT NULL DEFAULT 0;
            """);
        db.Database.ExecuteSqlRaw("""
            UPDATE "StudentPhotos"
            SET "SizeBytes" = octet_length("Content")
            WHERE "SizeBytes" = 0;
            """);
        db.Database.ExecuteSqlRaw("""
            ALTER TABLE "StudentPhotos"
            ALTER COLUMN "SizeBytes" DROP DEFAULT;
            """);
    }
}
