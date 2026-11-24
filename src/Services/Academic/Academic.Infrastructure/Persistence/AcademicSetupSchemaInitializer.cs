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

            CREATE TABLE IF NOT EXISTS "BatchRoutineSlots" (
                "Id" uuid NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                "BatchId" uuid NOT NULL,
                "SubjectId" uuid NOT NULL,
                "DayOfWeek" integer NOT NULL,
                "StartTime" time without time zone NOT NULL,
                "EndTime" time without time zone NOT NULL,
                "RoomCode" character varying(60) NOT NULL,
                "TeacherName" character varying(100) NULL,
                CONSTRAINT "PK_BatchRoutineSlots" PRIMARY KEY ("Id"),
                CONSTRAINT "CK_BatchRoutineSlots_DayOfWeek" CHECK ("DayOfWeek" BETWEEN 1 AND 7),
                CONSTRAINT "CK_BatchRoutineSlots_TimeRange" CHECK ("EndTime" > "StartTime"),
                CONSTRAINT "FK_BatchRoutineSlots_AcademicBatches_BatchId"
                    FOREIGN KEY ("BatchId") REFERENCES "AcademicBatches" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_BatchRoutineSlots_Subjects_SubjectId"
                    FOREIGN KEY ("SubjectId") REFERENCES "Subjects" ("Id") ON DELETE CASCADE
            );

            ALTER TABLE "BatchRoutineSlots"
                ADD COLUMN IF NOT EXISTS "TeacherName" character varying(100) NULL;

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_BatchRoutineSlots_BatchId_DayOfWeek_StartTime"
                ON "BatchRoutineSlots" ("BatchId", "DayOfWeek", "StartTime");
            CREATE INDEX IF NOT EXISTS "IX_BatchRoutineSlots_BatchId_DayOfWeek"
                ON "BatchRoutineSlots" ("BatchId", "DayOfWeek");
            """);
    }
}
