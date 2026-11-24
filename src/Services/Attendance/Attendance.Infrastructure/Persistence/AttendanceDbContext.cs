using Coaching.Attendance.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Attendance.Infrastructure;

public class AttendanceDbContext(DbContextOptions<AttendanceDbContext> options) : DbContext(options)
{
    public DbSet<ClassSession> Sessions => Set<ClassSession>();
    public DbSet<AttendanceRecord> Records => Set<AttendanceRecord>();
    public DbSet<StudentRef> Students => Set<StudentRef>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<ClassSession>(e => { e.HasIndex(x => new { x.ClassLevel, x.RoomCode, x.StartsAt }); });
        b.Entity<AttendanceRecord>(e =>
        {
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.Source).HasConversion<string>().HasMaxLength(16);
            e.HasIndex(x => new { x.SessionId, x.StudentId }).IsUnique(); // one record per student per session
        });
        b.Entity<StudentRef>(e =>
        {
            e.HasKey(x => x.StudentId);
            e.HasIndex(x => x.DeviceUserId);
            e.Property(x => x.IsActive).HasDefaultValue(true);
        });
    }
}
