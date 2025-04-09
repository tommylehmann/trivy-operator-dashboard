using Microsoft.Extensions.Options;
using System.Reflection;
using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.AppVersions.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Clients.Models;

namespace TrivyOperator.Dashboard.Application.Services.AppVersions;

public class AppVersionService(IGitHubClient gitHubClient, IOptions<GitHubOptions> options, ILogger<AppVersionService> logger) : IAppVersionService
{
    public async Task<GitHubRelease?> GetTrivyDashboardLatestRelease()
    {
        GitHubRelease? release = await gitHubClient.GetLatestRelease(options.Value.BaseTrivyDashboardRepoUrl);
        if (release is null)
        {
            logger.LogWarning("Failed to fetch the latest release from GitHub.");
        }
        return release;
    }

    public async Task<GitHubRelease[]?> GetTrivyDashboardReleases()
    {
        GitHubRelease[]? releases = await gitHubClient.GitHubReleases(options.Value.BaseTrivyDashboardRepoUrl);
        if (releases is null)
        {
            logger.LogWarning("Failed to fetch releases from GitHub.");
        }
        return releases;
    }

    public async Task<GitHubRelease?> GetTrivyOperatorLatestRelease()
    {
        GitHubRelease? release = await gitHubClient.GetLatestRelease(options.Value.BaseTrivyOperatorRepoUrl);
        if (release is null)
        {
            logger.LogWarning("Failed to fetch the latest release from GitHub.");
        }
        return release;
    }

    public AppVersion GetCurrentVersion()
    {
        var assembly = Assembly.GetExecutingAssembly();

        return new AppVersion {
            FileVersion = assembly.GetCustomAttribute<AssemblyFileVersionAttribute>()?.Version ?? "0.0",
            InformationalVersion = assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? "0.0",
        };
    }
}
