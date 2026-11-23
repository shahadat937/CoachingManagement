using Coaching.Exams.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Exams.Infrastructure;

public class ExamsDbContext(DbContextOptions<ExamsDbContext> options) : DbContext(options)
{
    public DbSet<Exam> Exams => Set<Exam>();
}
