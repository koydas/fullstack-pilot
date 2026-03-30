using DependenciesService.Models;
using Microsoft.EntityFrameworkCore;

namespace DependenciesService.Data;

public class DependenciesDbContext : DbContext
{
    public DependenciesDbContext(DbContextOptions<DependenciesDbContext> options) : base(options)
    {
    }

    public DbSet<Dependancy> Dependencies => Set<Dependancy>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Dependancy>(entity =>
        {
            entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Description).HasMaxLength(4000);
            entity.Property(p => p.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()")
                .ValueGeneratedOnAdd();
        });
    }
}
