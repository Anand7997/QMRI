using qMRI.Api.DependencyInjection;
using qMRI.Api.Extensions;
using qMRI.Application.DependencyInjection;
using qMRI.Infrastructure.DependencyInjection;
using qMRI.Infrastructure.Persistence.Seed;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

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

await app.MigrateDatabaseAsync();

using (var scope = app.Services.CreateScope())
{
	await IdentityDataSeeder.SeedAsync(scope.ServiceProvider);
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
