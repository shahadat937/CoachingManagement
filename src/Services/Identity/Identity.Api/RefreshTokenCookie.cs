using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace Coaching.Identity.Api;

internal static class RefreshTokenCookie
{
    public const string Name = "coaching_refresh_token";
    private const string Path = "/api/auth";

    public static void Append(HttpResponse response, string token, DateTimeOffset expiresAt, IHostEnvironment environment)
    {
        response.Cookies.Append(Name, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = Path,
            Expires = expiresAt.UtcDateTime,
            IsEssential = true,
        });
    }

    public static void Clear(HttpResponse response, IHostEnvironment environment)
    {
        response.Cookies.Delete(Name, new CookieOptions
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = Path,
            IsEssential = true,
        });
    }
}
