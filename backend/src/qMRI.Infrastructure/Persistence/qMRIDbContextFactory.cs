using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace qMRI.Infrastructure.Persistence;

public sealed class qMRIDbContextFactory : IDesignTimeDbContextFactory<qMRIDbContext>
{
    public qMRIDbContext CreateDbContext(string[] args)
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        var apiProjectDirectory = Path.GetFullPath(Path.Combine(currentDirectory, "..", "qMRI.Api"));

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiProjectDirectory)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        var optionsBuilder = new DbContextOptionsBuilder<qMRIDbContext>();

        optionsBuilder.UseSqlServer(connectionString, sqlOptions =>
        {
            sqlOptions.MigrationsAssembly(typeof(qMRIDbContext).Assembly.FullName);
            sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "dbo");
        });

        return new qMRIDbContext(optionsBuilder.Options);
    }
}