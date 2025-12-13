using System.ComponentModel.DataAnnotations;

namespace DependanciesService.Models;

public class ProjectInput
{
    [Required]
    [StringLength(100)]
    public string Name { get; init; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; init; }
}
