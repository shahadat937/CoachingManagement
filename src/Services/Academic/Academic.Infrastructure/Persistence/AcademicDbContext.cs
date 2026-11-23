using Coaching.Academic.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Academic.Infrastructure;

public class AcademicDbContext(DbContextOptions<AcademicDbContext> options) : DbContext(options)
{
    public DbSet<Subject> Subjects => Set<Subject>();
}
