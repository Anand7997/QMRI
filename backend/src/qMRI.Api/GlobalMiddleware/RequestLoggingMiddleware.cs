using Serilog.Context;

namespace qMRI.Api.GlobalMiddleware;

public sealed class RequestLoggingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Items["X-Correlation-Id"]?.ToString();

        using (LogContext.PushProperty("CorrelationId", correlationId ?? string.Empty))
        {
            await next(context);
        }
    }
}
