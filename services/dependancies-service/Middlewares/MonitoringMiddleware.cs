using System.Diagnostics;

namespace DependanciesService.Middlewares;

public class MonitoringMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<MonitoringMiddleware> _logger;

    public MonitoringMiddleware(RequestDelegate next, ILogger<MonitoringMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var request = context.Request;

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            _logger.LogInformation(
                "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMilliseconds}ms",
                request.Method,
                request.Path,
                context.Response?.StatusCode,
                stopwatch.ElapsedMilliseconds);
        }
    }
}
