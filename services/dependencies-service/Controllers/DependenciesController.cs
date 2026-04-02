using DependenciesService.Models;
using DependenciesService.Services;
using Microsoft.AspNetCore.Mvc;

namespace DependenciesService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DependenciesController : ControllerBase
{
    private readonly IDependancyRepository _repository;
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;

    public DependenciesController(IDependancyRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> GetDependencies(
        [FromQuery] int? limit,
        [FromQuery] int? offset
    )
    {
        var parsedLimit = limit ?? DefaultLimit;
        var parsedOffset = offset ?? 0;

        if (parsedLimit < 0 || parsedOffset < 0)
        {
            return BadRequest(new { error = "Query parameters 'limit' and 'offset' must be non-negative integers." });
        }

        parsedLimit = Math.Min(parsedLimit, MaxLimit);
        var (items, total) = await _repository.GetAllAsync(parsedLimit, parsedOffset);

        return Ok(new
        {
            items,
            total,
            limit = parsedLimit,
            offset = parsedOffset
        });
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Dependancy>> GetDependancy(Guid id)
    {
        var dependancy = await _repository.GetAsync(id);
        return dependancy is null ? NotFound() : Ok(dependancy);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Dependancy>> CreateDependancy([FromBody] DependancyInput input)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var dependancy = new Dependancy
        {
            Name = input.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(input.Description) ? null : input.Description.Trim()
        };

        await _repository.CreateAsync(dependancy);
        return CreatedAtAction(nameof(GetDependancy), new { id = dependancy.Id }, dependancy);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Dependancy>> UpdateDependancy(Guid id, [FromBody] DependancyInput input)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var updated = new Dependancy
        {
            Id = id,
            Name = input.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(input.Description) ? null : input.Description.Trim()
        };

        var result = await _repository.UpdateAsync(id, updated);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDependancy(Guid id)
    {
        var deleted = await _repository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
