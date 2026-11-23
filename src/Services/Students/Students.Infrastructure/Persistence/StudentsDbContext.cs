using Coaching.Students.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Students.Infrastructure;

public class StudentsDbContext(DbContextOptions<StudentsDbContext> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<StudentOutboxMessage> StudentOutbox => Set<StudentOutboxMessage>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Student>(e =>
        {
            e.HasIndex(x => x.StudentNo).IsUnique();
            e.HasIndex(x => x.DeviceUserId).IsUnique();
        });
        b.Entity<StudentOutboxMessage>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.FullName).HasMaxLength(256);
            e.Property(x => x.GuardianPhone).HasMaxLength(64);
            e.Property(x => x.LastError).HasMaxLength(1000);
            e.HasIndex(x => new { x.PublishedAt, x.NextAttemptAt, x.OccurredAt });
        });
    }
}
