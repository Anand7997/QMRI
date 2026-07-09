using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace qMRI.Api.Filters;

public sealed class GlobalExceptionFilter(
    ILogger<GlobalExceptionFilter> logger) : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        var statusCode = context.Exception switch
        {
            ArgumentException => StatusCodes.Status400BadRequest,
            InvalidOperationException => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status500InternalServerError
        };

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(context.Exception, "Unhandled exception captured by global exception filter.");
        }
        else
        {
            logger.LogWarning(context.Exception, "Request validation exception captured by global exception filter.");
        }

        context.Result = new ObjectResult(new
        {
            message = statusCode == StatusCodes.Status500InternalServerError
                ? "An unexpected error occurred."
                : context.Exception.Message,
            traceId = context.HttpContext.TraceIdentifier
        })
        {
            StatusCode = statusCode
        };

        context.ExceptionHandled = true;
    }
}
