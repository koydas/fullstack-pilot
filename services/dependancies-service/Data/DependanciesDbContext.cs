using DependanciesService.Models;
using Microsoft.EntityFrameworkCore;

namespace DependanciesService.Data;

public class DependanciesDbContext : DbContext
{
    public DependanciesDbContext(DbContextOptions<DependanciesDbContext> options) : base(options)
    {
    }

    public DbSet<Dependancy> Dependancies => Set<Dependancy>();

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
