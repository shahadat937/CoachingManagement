using Coaching.Students.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Students.Infrastructure;

public class StudentsDbContext(DbContextOptions<StudentsDbContext> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<StudentPhoto> StudentPhotos => Set<StudentPhoto>();
    public DbSet<StudentOutboxMessage> StudentOutbox => Set<StudentOutboxMessage>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Student>(e =>
        {
            e.HasIndex(x => x.StudentNo).IsUnique();
            e.HasIndex(x => x.DeviceUserId).IsUnique();
        });
        b.Entity<StudentPhoto>(e =>
        {
            e.HasKey(x => x.StudentId);
            e.Property(x => x.ContentType).HasMaxLength(32);
            e.Property(x => x.Content).HasColumnType("bytea");
            e.HasOne<Student>()
                .WithOne()
                .HasForeignKey<StudentPhoto>(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
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
