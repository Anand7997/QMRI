using qMRI.Api.GlobalMiddleware;
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
}
