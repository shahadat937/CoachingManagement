using Coaching.Academic.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Academic.Infrastructure;

public class AcademicDbContext(DbContextOptions<AcademicDbContext> options) : DbContext(options)
{
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<AcademicBatch> AcademicBatches => Set<AcademicBatch>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<Subject>(entity =>
        {
            entity.Property(subject => subject.Name).HasMaxLength(120);
            entity.Property(subject => subject.Code).HasMaxLength(32);
            entity.HasIndex(subject => new { subject.ClassLevel, subject.Name }).IsUnique();
            entity.HasIndex(subject => new { subject.ClassLevel, subject.Code }).IsUnique();
        });

        builder.Entity<AcademicBatch>(entity =>
        {
            entity.Property(batch => batch.Name).HasMaxLength(100);
            entity.Property(batch => batch.Code).HasMaxLength(32);
            entity.HasIndex(batch => new { batch.ClassLevel, batch.Name }).IsUnique();
            entity.HasIndex(batch => new { batch.ClassLevel, batch.Code }).IsUnique();
        });
    }
}
