using DotNetService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IProjectRepository, ProjectRepository>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();

app.Run();
