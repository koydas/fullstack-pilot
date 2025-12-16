using System.ComponentModel.DataAnnotations;

namespace DependanciesService.Models;

public class DependancyInput
{
    [Required]
    [StringLength(200)]
    public string Name { get; init; } = string.Empty;

    [StringLength(4000)]
    public string? Description { get; init; }
}
