using System.Security.Cryptography;
using System.Text;
using Coaching.Identity.Application;
using Microsoft.Extensions.Options;

namespace Coaching.Identity.Infrastructure;

public sealed class RefreshTokenOptions
{
    public const string SectionName = "RefreshToken";

    public int LifetimeDays { get; set; } = 7;

    public void Validate()
    {
        if (LifetimeDays is < 1 or > 90)
            throw new InvalidOperationException("RefreshToken:LifetimeDays must be between 1 and 90.");
    }
}

public sealed class RefreshTokenFactory(IOptions<RefreshTokenOptions> options) : IRefreshTokenFactory
{
    public IssuedRefreshToken Create(DateTimeOffset now)
    {
        var settings = options.Value;
        settings.Validate();

        var value = ToBase64Url(RandomNumberGenerator.GetBytes(64));
        return new IssuedRefreshToken(value, Hash(value), now.AddDays(settings.LifetimeDays));
    }

    public string Hash(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("A refresh token is required.", nameof(token));

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }

    private static string ToBase64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
