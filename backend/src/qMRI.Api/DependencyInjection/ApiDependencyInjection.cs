using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using qMRI.Api.Configuration.Options;
using qMRI.Api.Filters;
using qMRI.Api.Services;
using qMRI.Application.Assessments.Abstractions;
using System.Text;

namespace qMRI.Api.DependencyInjection;

public static class ApiDependencyInjection
{
    public static IServiceCollection AddApiLayer(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<DatabaseOptions>(configuration.GetSection(DatabaseOptions.SectionName));
        services.Configure<OpenAiOptions>(configuration.GetSection(OpenAiOptions.SectionName));
        services.AddMemoryCache();
        services.AddHttpClient<IQmriAgentAnalysisService, OpenAiAssessmentAnalysisService>(client =>
        {
            client.BaseAddress = new Uri("https://api.openai.com");
            client.Timeout = TimeSpan.FromSeconds(90);
        });

        var jwtOptions = configuration
            .GetSection(JwtOptions.SectionName)
            .Get<JwtOptions>() ?? new JwtOptions();

        services
            .AddControllers(options =>
            {
                options.Filters.Add<GlobalExceptionFilter>();
                options.Filters.Add<ModelStateValidationFilter>();
            })
            .ConfigureApiBehaviorOptions(options =>
            {
                options.SuppressModelStateInvalidFilter = true;
            });

        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            var securityScheme = new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Description = "Enter a valid JWT bearer token.",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Reference = new OpenApiReference
                {
                    Id = "Bearer",
                    Type = ReferenceType.SecurityScheme
                }
            };

            options.AddSecurityDefinition("Bearer", securityScheme);
            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    securityScheme,
                    Array.Empty<string>()
                }
            });
        });

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    RoleClaimType = System.Security.Claims.ClaimTypes.Role,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtOptions.SigningKey))
                };
            });

        services.AddAuthorization();

        services.AddCors(options =>
        {
            options.AddPolicy("DefaultCors", policy =>
            {
                var allowedOrigins = configuration
                    .GetSection("Cors:AllowedOrigins")
                    .Get<string[]>();

                policy
                    .AllowAnyHeader()
                    .AllowAnyMethod();

                if (allowedOrigins is { Length: > 0 })
                {
                    policy.WithOrigins(allowedOrigins);
                }
                else
                {
                    policy.AllowAnyOrigin();
                }
            });
        });

        services.AddScoped<GlobalExceptionFilter>();
        services.AddScoped<ModelStateValidationFilter>();

        return services;
    }
}
