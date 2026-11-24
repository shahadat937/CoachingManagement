namespace Coaching.Students.Application;

public sealed record StudentPhotoMetadata(string ContentType, long SizeBytes, DateTimeOffset UpdatedAt);

public sealed record StudentPhotoContent(byte[] Bytes, StudentPhotoMetadata Metadata);

public sealed class StudentPhotoValidationException(string message) : Exception(message);

public sealed class StudentPhotoSizeLimitExceededException : Exception
{
    public StudentPhotoSizeLimitExceededException() : base($"A student photo must be {StudentPhotoUploadValidation.MaxPhotoBytes / (1024 * 1024)} MiB or smaller.") { }
}

/// <summary>
/// Validates untrusted upload bytes before they are persisted. We intentionally
/// derive the media type from the binary signature and reject a MIME mismatch.
/// SVG and GIF are intentionally excluded from this small, safe image allowlist.
/// </summary>
public static class StudentPhotoUploadValidation
{
    public const int MaxPhotoBytes = 2 * 1024 * 1024;
    public const long MaxRequestBytes = MaxPhotoBytes + (64 * 1024);

    public static StudentPhotoUpload Validate(string? declaredContentType, byte[] content)
    {
        if (content.Length == 0)
            throw new StudentPhotoValidationException("Choose a non-empty JPEG, PNG, or WebP image.");

        if (content.Length > MaxPhotoBytes)
            throw new StudentPhotoSizeLimitExceededException();

        var detectedContentType = DetectContentType(content);
        if (detectedContentType is null)
            throw new StudentPhotoValidationException("Only JPEG, PNG, and WebP photos are supported.");

        var normalizedDeclaredType = NormalizeContentType(declaredContentType);
        if (!string.Equals(normalizedDeclaredType, detectedContentType, StringComparison.Ordinal))
        {
            throw new StudentPhotoValidationException(
                "The uploaded photo's MIME type does not match its file content.");
        }

        return new StudentPhotoUpload(detectedContentType, content);
    }

    private static string? NormalizeContentType(string? value)
    {
        var mimeType = value?.Split(';', 2)[0].Trim();
        return string.IsNullOrWhiteSpace(mimeType) ? null : mimeType.ToLowerInvariant();
    }

    private static string? DetectContentType(byte[] content)
    {
        if (content.Length >= 3 && content[0] == 0xFF && content[1] == 0xD8 && content[2] == 0xFF)
            return "image/jpeg";

        if (content.Length >= 8 &&
            content[0] == 0x89 && content[1] == 0x50 && content[2] == 0x4E && content[3] == 0x47 &&
            content[4] == 0x0D && content[5] == 0x0A && content[6] == 0x1A && content[7] == 0x0A)
        {
            return "image/png";
        }

        if (content.Length >= 12 &&
            content[0] == (byte)'R' && content[1] == (byte)'I' && content[2] == (byte)'F' && content[3] == (byte)'F' &&
            content[8] == (byte)'W' && content[9] == (byte)'E' && content[10] == (byte)'B' && content[11] == (byte)'P')
        {
            return "image/webp";
        }

        return null;
    }
}

public sealed record StudentPhotoUpload(string ContentType, byte[] Content);
