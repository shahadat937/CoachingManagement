using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.Academic.Infrastructure;

/// <summary>
/// Brings an already-created local Academic database forward while the service still uses
/// EnsureCreated during development. Replace with EF Core migrations before production.
/// </summary>
public static class AcademicSetupSchemaInitializer
{
    public static void EnsureAcademicSetupSchema(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();

        db.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS "AcademicBatches" (
                "Id" uuid NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                "ClassLevel" integer NOT NULL,
                "Name" character varying(100) NOT NULL,
                "Code" character varying(32) NULL,
                CONSTRAINT "PK_AcademicBatches" PRIMARY KEY ("Id")
            );

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_AcademicBatches_ClassLevel_Name"
                ON "AcademicBatches" ("ClassLevel", "Name");
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_AcademicBatches_ClassLevel_Code"
                ON "AcademicBatches" ("ClassLevel", "Code");
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Subjects_ClassLevel_Name"
                ON "Subjects" ("ClassLevel", "Name");
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Subjects_ClassLevel_Code"
                ON "Subjects" ("ClassLevel", "Code");
            """);
    }
}
