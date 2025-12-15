using System.Collections.Concurrent;
using DependanciesService.Models;

namespace DependanciesService.Services;

public interface IProjectRepository
{
    IEnumerable<Project> GetAll();
    Project? Get(Guid id);
    Project Create(Project project);
    Project? Update(Guid id, Project updated);
    bool Delete(Guid id);
}

public class ProjectRepository : IProjectRepository
{
    private readonly ConcurrentDictionary<Guid, Project> _storage = new();

    public ProjectRepository()
    {
        var sample = new Project
        {
            Name = "Starter project",
            Description = "Example payload to prove the API is working."
        };
        _storage[sample.Id] = sample;
    }

    public IEnumerable<Project> GetAll() => _storage.Values.OrderBy(p => p.CreatedAt);

    public Project? Get(Guid id) => _storage.TryGetValue(id, out var project) ? project : null;

    public Project Create(Project project)
    {
        _storage[project.Id] = project;
        return project;
    }

    public Project? Update(Guid id, Project updated)
    {
        if (!_storage.ContainsKey(id))
        {
            return null;
        }

        var merged = updated with
        {
            Id = id,
            CreatedAt = _storage[id].CreatedAt
        };

        _storage[id] = merged;
        return merged;
    }

    public bool Delete(Guid id) => _storage.TryRemove(id, out _);
}
