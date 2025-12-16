using DependanciesService.Data;
using DependanciesService.Services;
using DependanciesService.Middlewares;
using DependanciesService.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DependanciesDb")
    ?? throw new InvalidOperationException("Connection string 'DependanciesDb' not configured.");

builder.Services.AddDbContext<DependanciesDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IDependancyRepository, DependancyRepository>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DependanciesDbContext>();
    db.Database.EnsureCreated();

    if (!db.Dependancies.Any())
    {
        db.Dependancies.Add(new Dependancy
        {
            Name = "Starter dependancy",
            Description = "Example payload to prove the API is working."
        });

        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<MonitoringMiddleware>();

app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();

app.Run();
