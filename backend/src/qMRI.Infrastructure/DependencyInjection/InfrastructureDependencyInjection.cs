using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using qMRI.Application.Assessments.Abstractions;
using qMRI.Application.Authentication.Abstractions;
using qMRI.Infrastructure.Assessments.Services;
using qMRI.Infrastructure.Authentication.Options;
using qMRI.Infrastructure.Authentication.Repositories;
using qMRI.Infrastructure.Authentication.Services;
using qMRI.Infrastructure.Persistence;

namespace qMRI.Infrastructure.DependencyInjection;

public static class InfrastructureDependencyInjection
{
    public static IServiceCollection AddInfrastructureLayer(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        var commandTimeoutSeconds = configuration.GetValue<int?>("Database:CommandTimeoutSeconds");
        var enableSensitiveDataLogging = configuration.GetValue<bool?>("Database:EnableSensitiveDataLogging") ?? false;
        services.Configure<IdentityLinkEmailOptions>(configuration.GetSection(IdentityLinkEmailOptions.SectionName));

        services.AddDbContext<qMRIDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.MigrationsAssembly(typeof(qMRIDbContext).Assembly.FullName);
                sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "dbo");

                if (commandTimeoutSeconds.HasValue)
                {
                    sqlOptions.CommandTimeout(commandTimeoutSeconds.Value);
                }
            });

            if (enableSensitiveDataLogging)
            {
                options.EnableSensitiveDataLogging();
            }
        });

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IPasswordHashingService, PasswordHashingService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IRefreshTokenFactory, RefreshTokenFactory>();
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<IUserAdministrationService, UserAdministrationService>();
        services.AddScoped<IIdentityLinkEmailSender, SmtpIdentityLinkEmailSender>();
        services.AddScoped<IAssessmentCatalogService, AssessmentCatalogService>();
        services.AddScoped<IScoringConfigurationService, ScoringConfigurationService>();
        services.AddScoped<IDashboardGovernanceService, DashboardGovernanceService>();
        services.AddScoped<IAssessmentExecutionService, AssessmentExecutionService>();
        services.AddScoped<IAssessmentSeedService, AssessmentSeedService>();

        return services;
    }
}

