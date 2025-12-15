using DependanciesService.Models;
using DependanciesService.Services;
using Microsoft.AspNetCore.Mvc;

namespace DependanciesService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DependanciesController : ControllerBase
{
    private readonly IProjectRepository _repository;

    public DependanciesController(IProjectRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<IEnumerable<Project>> GetProjects()
    {
        return Ok(_repository.GetAll());
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Project> GetProject(Guid id)
    {
        var project = _repository.Get(id);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<Project> CreateProject([FromBody] ProjectInput input)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var project = new Project
        {
            Name = input.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(input.Description) ? null : input.Description.Trim()
        };

        _repository.Create(project);
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Project> UpdateProject(Guid id, [FromBody] ProjectInput input)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var updated = new Project
        {
            Id = id,
            Name = input.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(input.Description) ? null : input.Description.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var result = _repository.Update(id, updated);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult DeleteProject(Guid id)
    {
        var deleted = _repository.Delete(id);
        return deleted ? NoContent() : NotFound();
    }
}
