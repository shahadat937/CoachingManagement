using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Coaching.Identity.Infrastructure.Persistence;

public static class RefreshTokenSchemaInitializer
{
    /// <summary>
    /// Adds the refresh-token table to existing development databases created before migrations were introduced.
    /// Replace this with EF Core migrations before production deployment.
    /// </summary>
    public static void EnsureRefreshTokenSchema(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

        db.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS "RefreshTokens" (
                "Id" uuid NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                "UserId" uuid NOT NULL,
                "TokenHash" character varying(64) NOT NULL,
                "ExpiresAt" timestamp with time zone NOT NULL,
                "RevokedAt" timestamp with time zone NULL,
                "ReplacedByTokenHash" character varying(64) NULL,
                CONSTRAINT "PK_RefreshTokens" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_RefreshTokens_AppUsers_UserId"
                    FOREIGN KEY ("UserId") REFERENCES "AppUsers" ("Id") ON DELETE CASCADE
            );
            """);
        db.Database.ExecuteSqlRaw("""
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_RefreshTokens_TokenHash"
            ON "RefreshTokens" ("TokenHash");
            """);
        db.Database.ExecuteSqlRaw("""
            CREATE INDEX IF NOT EXISTS "IX_RefreshTokens_UserId_ExpiresAt"
            ON "RefreshTokens" ("UserId", "ExpiresAt");
            """);
    }
}
