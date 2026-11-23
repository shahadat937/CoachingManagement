using Coaching.Accounts.Domain;
using Microsoft.EntityFrameworkCore;

namespace Coaching.Accounts.Infrastructure;

public class AccountsDbContext(DbContextOptions<AccountsDbContext> options) : DbContext(options)
{
    public DbSet<FeeInvoice> FeeInvoices => Set<FeeInvoice>();
}
