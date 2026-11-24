using Coaching.Academic.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Academic.Infrastructure;

public class AcademicDbContext(DbContextOptions<AcademicDbContext> options) : DbContext(options)
{
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<AcademicBatch> AcademicBatches => Set<AcademicBatch>();
    public DbSet<BatchRoutineSlot> BatchRoutineSlots => Set<BatchRoutineSlot>();

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

        builder.Entity<BatchRoutineSlot>(entity =>
        {
            entity.Property(slot => slot.RoomCode).HasMaxLength(60);
            entity.Property(slot => slot.TeacherName).HasMaxLength(100);
            entity.Property(slot => slot.StartTime).HasColumnType("time without time zone");
            entity.Property(slot => slot.EndTime).HasColumnType("time without time zone");
            entity.HasIndex(slot => new { slot.BatchId, slot.DayOfWeek, slot.StartTime }).IsUnique();
            entity.HasIndex(slot => new { slot.BatchId, slot.DayOfWeek });
            entity.HasOne<AcademicBatch>()
                .WithMany()
                .HasForeignKey(slot => slot.BatchId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Subject>()
                .WithMany()
                .HasForeignKey(slot => slot.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.ToTable(table =>
            {
                table.HasCheckConstraint("CK_BatchRoutineSlots_DayOfWeek", "\"DayOfWeek\" BETWEEN 1 AND 7");
                table.HasCheckConstraint("CK_BatchRoutineSlots_TimeRange", "\"EndTime\" > \"StartTime\"");
            });
        });
    }
}
