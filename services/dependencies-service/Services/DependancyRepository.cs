using DependenciesService.Models;
using DependenciesService.Data;
using Microsoft.EntityFrameworkCore;

namespace DependenciesService.Services;

public interface IDependancyRepository
{
    Task<(IEnumerable<Dependancy> Items, int Total)> GetAllAsync(int limit, int offset);
    Task<Dependancy?> GetAsync(Guid id);
    Task<Dependancy> CreateAsync(Dependancy dependancy);
    Task<Dependancy?> UpdateAsync(Guid id, Dependancy updated);
    Task<bool> DeleteAsync(Guid id);
}

public class DependancyRepository : IDependancyRepository
{
    private readonly DependenciesDbContext _context;

    public DependancyRepository(DependenciesDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<Dependancy> Items, int Total)> GetAllAsync(int limit, int offset)
    {
        var total = await _context.Dependencies.CountAsync();
        var items = await _context.Dependencies
            .AsNoTracking()
            .OrderBy(p => p.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        return (items, total);
    }

    public async Task<Dependancy?> GetAsync(Guid id) =>
        await _context.Dependencies.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Dependancy> CreateAsync(Dependancy dependancy)
    {
        dependancy.CreatedAt = DateTime.UtcNow;
        _context.Dependencies.Add(dependancy);
        await _context.SaveChangesAsync();
        return dependancy;
    }

    public async Task<Dependancy?> UpdateAsync(Guid id, Dependancy updated)
    {
        var existing = await _context.Dependencies.FirstOrDefaultAsync(p => p.Id == id);

        if (existing is null)
        {
            return null;
        }

        existing.Name = updated.Name;
        existing.Description = updated.Description;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.Dependencies.FirstOrDefaultAsync(p => p.Id == id);

        if (existing is null)
        {
            return false;
        }

        _context.Dependencies.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}
