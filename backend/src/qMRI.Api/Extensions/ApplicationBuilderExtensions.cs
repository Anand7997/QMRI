using Microsoft.EntityFrameworkCore;
using qMRI.Api.GlobalMiddleware;
using qMRI.Infrastructure.Persistence;
using Serilog;

namespace qMRI.Api.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseGlobalMiddleware(this IApplicationBuilder app)
    {
        app.UseMiddleware<CorrelationIdMiddleware>();
        app.UseMiddleware<RequestLoggingMiddleware>();
        app.UseSerilogRequestLogging();
        app.UseCors("DefaultCors");

        return app;
    }

    public static async Task MigrateDatabaseAsync(this WebApplication app, CancellationToken cancellationToken = default)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<qMRIDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<qMRIDbContext>>();

        logger.LogInformation("Applying database migrations.");
        await dbContext.Database.MigrateAsync(cancellationToken);
        logger.LogInformation("Database migrations applied.");
    }
}
