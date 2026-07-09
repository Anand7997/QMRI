# qMRI ASP.NET Core Solution Structure

## Projects

```text
backend
|-- qMRI.sln
|-- Directory.Build.props
|-- global.json
|-- README.md
|
|-- src
|   |-- qMRI.Api
|   |   |-- qMRI.Api.csproj
|   |   |-- Program.cs
|   |   |-- appsettings.json
|   |   |-- appsettings.Development.json
|   |   |-- Properties
|   |   |   |-- launchSettings.json
|   |   |-- Configuration
|   |   |   |-- Options
|   |   |       |-- JwtOptions.cs
|   |   |       |-- DatabaseOptions.cs
|   |   |-- DependencyInjection
|   |   |   |-- ApiDependencyInjection.cs
|   |   |-- GlobalMiddleware
|   |   |   |-- CorrelationIdMiddleware.cs
|   |   |   |-- RequestLoggingMiddleware.cs
|   |   |-- Filters
|   |   |   |-- GlobalExceptionFilter.cs
|   |   |   |-- ModelStateValidationFilter.cs
|   |   |-- Extensions
|   |   |   |-- ApplicationBuilderExtensions.cs
|   |   |-- Controllers
|   |       |-- HealthController.cs
|   |
|   |-- qMRI.Application
|   |   |-- qMRI.Application.csproj
|   |   |-- DependencyInjection
|   |   |   |-- ApplicationDependencyInjection.cs
|   |   |-- Common
|   |       |-- Abstractions
|   |       |-- Behaviors
|   |       |-- DTOs
|   |       |-- Validators
|   |
|   |-- qMRI.Domain
|   |   |-- qMRI.Domain.csproj
|   |   |-- Common
|   |       |-- Entities
|   |       |-- Enums
|   |       |-- ValueObjects
|   |       |-- Rules
|   |
|   |-- qMRI.Infrastructure
|   |   |-- qMRI.Infrastructure.csproj
|   |   |-- DependencyInjection
|   |   |   |-- InfrastructureDependencyInjection.cs
|   |   |-- Persistence
|   |   |   |-- qMRIDbContext.cs
|   |   |   |-- Configurations
|   |   |-- Security
|   |   |-- Observability
|   |   |-- Storage
|   |
|   |-- qMRI.Shared
|       |-- qMRI.Shared.csproj
|       |-- Contracts
|       |-- Responses
|       |-- Constants
|       |-- Utilities
|
|-- tests
|   |-- qMRI.UnitTests
|   |   |-- qMRI.UnitTests.csproj
|   |-- qMRI.IntegrationTests
|   |   |-- qMRI.IntegrationTests.csproj
|   |-- qMRI.ApiTests
|       |-- qMRI.ApiTests.csproj
```

## Dependencies

### Project References

```text
qMRI.Api -> qMRI.Application, qMRI.Infrastructure, qMRI.Shared
qMRI.Application -> qMRI.Domain, qMRI.Shared
qMRI.Infrastructure -> qMRI.Application, qMRI.Domain, qMRI.Shared
qMRI.UnitTests -> qMRI.Application, qMRI.Domain
qMRI.IntegrationTests -> qMRI.Api, qMRI.Infrastructure
qMRI.ApiTests -> qMRI.Api
```

### Package Dependencies

```text
qMRI.Api
- FluentValidation.AspNetCore
- Microsoft.AspNetCore.Authentication.JwtBearer
- Serilog.AspNetCore
- Serilog.Settings.Configuration
- Swashbuckle.AspNetCore

qMRI.Application
- FluentValidation.DependencyInjectionExtensions
- MediatR

qMRI.Infrastructure
- Microsoft.EntityFrameworkCore
- Microsoft.EntityFrameworkCore.Design
- Microsoft.EntityFrameworkCore.SqlServer
- Microsoft.Extensions.Options.ConfigurationExtensions
```

## Configuration

```text
qMRI.Api/appsettings.json
- AllowedHosts
- ConnectionStrings:DefaultConnection
- Jwt
- Database
- Serilog
- Logging

qMRI.Api/appsettings.Development.json
- ConnectionStrings override
- Jwt override
- Database override
- Serilog override
- Logging override
```

## Program.cs Structure

```text
1. CreateBuilder
2. Configure Serilog host logging
3. Register DI layers
   - AddApiLayer(configuration)
   - AddApplicationLayer()
   - AddInfrastructureLayer(configuration)
4. Build application
5. UseGlobalMiddleware()
6. Swagger (development)
7. UseHttpsRedirection
8. UseAuthentication
9. UseAuthorization
10. MapControllers
11. Run
```

## Dependency Injection Structure

```text
qMRI.Api/DependencyInjection/ApiDependencyInjection.cs
- Options binding
- Controllers + filters
- Swagger
- JWT authentication
- Authorization
- CORS

qMRI.Application/DependencyInjection/ApplicationDependencyInjection.cs
- MediatR registration

qMRI.Infrastructure/DependencyInjection/InfrastructureDependencyInjection.cs
- DbContext registration
- SQL Server wiring
```

## Global Middleware Structure

```text
qMRI.Api/GlobalMiddleware/CorrelationIdMiddleware.cs
qMRI.Api/GlobalMiddleware/RequestLoggingMiddleware.cs
qMRI.Api/Extensions/ApplicationBuilderExtensions.cs
- UseMiddleware<CorrelationIdMiddleware>()
- UseMiddleware<RequestLoggingMiddleware>()
- UseSerilogRequestLogging()
- UseCors("DefaultCors")
```

## Logging Structure

```text
Host logging: Serilog in Program.cs
Request logging: UseSerilogRequestLogging in global middleware chain
Correlation support: CorrelationIdMiddleware + RequestLoggingMiddleware
Configuration source: appsettings.json + appsettings.{Environment}.json
```
