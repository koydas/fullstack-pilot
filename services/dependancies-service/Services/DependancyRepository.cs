using DependanciesService.Models;
using DependanciesService.Data;
using Microsoft.EntityFrameworkCore;

namespace DependanciesService.Services;

public interface IDependancyRepository
{
    Task<IEnumerable<Dependancy>> GetAllAsync();
    Task<Dependancy?> GetAsync(Guid id);
    Task<Dependancy> CreateAsync(Dependancy dependancy);
    Task<Dependancy?> UpdateAsync(Guid id, Dependancy updated);
    Task<bool> DeleteAsync(Guid id);
}

public class DependancyRepository : IDependancyRepository
{
    private readonly DependanciesDbContext _context;

    public DependancyRepository(DependanciesDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Dependancy>> GetAllAsync() =>
        await _context.Dependancies.AsNoTracking().OrderBy(p => p.CreatedAt).ToListAsync();

    public async Task<Dependancy?> GetAsync(Guid id) =>
        await _context.Dependancies.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Dependancy> CreateAsync(Dependancy dependancy)
    {
        dependancy.CreatedAt = DateTime.UtcNow;
        _context.Dependancies.Add(dependancy);
        await _context.SaveChangesAsync();
        return dependancy;
    }

    public async Task<Dependancy?> UpdateAsync(Guid id, Dependancy updated)
    {
        var existing = await _context.Dependancies.FirstOrDefaultAsync(p => p.Id == id);

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
        var existing = await _context.Dependancies.FirstOrDefaultAsync(p => p.Id == id);

        if (existing is null)
        {
            return false;
        }

        _context.Dependancies.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}
