using Coaching.Identity.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Identity.Infrastructure;

public class IdentityDbContext(DbContextOptions<IdentityDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> AppUsers => Set<AppUser>();
}
