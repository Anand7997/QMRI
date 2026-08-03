using qMRI.Api.DependencyInjection;
using qMRI.Api.Extensions;
using qMRI.Application.DependencyInjection;
using qMRI.Infrastructure.DependencyInjection;
using qMRI.Infrastructure.Persistence.Seed;
using Serilog;

LoadDotEnv();

var builder = WebApplication.CreateBuilder(args);

ApplyOpenAiEnvironmentFallbacks(builder.Configuration);

builder.Host.UseSerilog((context, services, loggerConfiguration) =>
{
	loggerConfiguration
		.ReadFrom.Configuration(context.Configuration)
		.ReadFrom.Services(services)
		.Enrich.FromLogContext();
});

builder.Services
	.AddApiLayer(builder.Configuration)
	.AddApplicationLayer()
	.AddInfrastructureLayer(builder.Configuration);

var app = builder.Build();

try
{
	await app.MigrateDatabaseAsync();

	using var scope = app.Services.CreateScope();
	await IdentityDataSeeder.SeedAsync(scope.ServiceProvider);
}
catch (Exception ex) when (app.Environment.IsDevelopment())
{
	app.Logger.LogError(ex, "Database startup initialization failed. Continuing because the app is running in Development.");
}

app.UseGlobalMiddleware();

if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static void LoadDotEnv()
{
	var directory = new DirectoryInfo(Directory.GetCurrentDirectory());

	while (directory is not null)
	{
		var envPath = Path.Combine(directory.FullName, ".env");

		if (File.Exists(envPath))
		{
			foreach (var line in File.ReadLines(envPath))
			{
				var trimmed = line.Trim();

				if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith('#'))
				{
					continue;
				}

				var separatorIndex = trimmed.IndexOf('=');

				if (separatorIndex <= 0)
				{
					continue;
				}

				var key = trimmed[..separatorIndex].Trim();
				var value = trimmed[(separatorIndex + 1)..].Trim().Trim('"');

				if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
				{
					Environment.SetEnvironmentVariable(key, value);

					if (key.Equals("OPENAI_API_KEY", StringComparison.OrdinalIgnoreCase))
					{
						Environment.SetEnvironmentVariable("OpenAI__ApiKey", value);
					}

					if (key.Equals("OPENAI_MODEL", StringComparison.OrdinalIgnoreCase))
					{
						Environment.SetEnvironmentVariable("OpenAI__Model", value);
					}
				}
			}

			return;
		}

		directory = directory.Parent;
	}
}

static void ApplyOpenAiEnvironmentFallbacks(ConfigurationManager configuration)
{
	if (string.IsNullOrWhiteSpace(configuration["OpenAI:ApiKey"]))
	{
		configuration["OpenAI:ApiKey"] = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
	}

	if (string.IsNullOrWhiteSpace(configuration["OpenAI:Model"]))
	{
		configuration["OpenAI:Model"] = Environment.GetEnvironmentVariable("OPENAI_MODEL");
	}
}
