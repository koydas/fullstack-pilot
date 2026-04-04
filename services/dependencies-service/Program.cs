using DependenciesService.Data;
using DependenciesService.Services;
using DependenciesService.Middlewares;
using DependenciesService.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DependenciesDb")
    ?? throw new InvalidOperationException("Connection string 'DependenciesDb' not configured.");

builder.Services.AddDbContext<DependenciesDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IDependancyRepository, DependancyRepository>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

var migrateOnStartup = app.Environment.IsDevelopment() ||
    builder.Configuration.GetValue<bool>("Database:MigrateOnStartup");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DependenciesDbContext>();

    if (migrateOnStartup)
    {
        db.Database.Migrate();
    }
    else
    {
        var pendingMigrations = db.Database.GetPendingMigrations().ToList();
        if (pendingMigrations.Any())
        {
            throw new InvalidOperationException($"Pending migrations detected: {string.Join(", ", pendingMigrations)}");
        }
    }

    if (!db.Dependencies.Any())
    {
        db.Dependencies.Add(new Dependancy
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
