using System.Reflection;
using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.AppVersions.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Clients.Models;

namespace TrivyOperator.Dashboard.Application.Services.AppVersions;

public class AppVersionService(IConcurrentCache<long, GitHubRelease> cache) : IAppVersionService
{
    public Task<GitHubReleaseDto?> GetTrivyDashboardLatestRelease()
    {
        GitHubRelease? release = cache.Select(x => x.Value).FirstOrDefault(x => x.IsLatest == true);
        return Task.FromResult(release?.ToGitHubReleaseDto());
    }

    public Task<IList<GitHubReleaseDto>> GetTrivyDashboardReleases()
    {
        List<GitHubReleaseDto> releases = [.. cache.Select(x => x.Value.ToGitHubReleaseDto())];
        return Task.FromResult((IList<GitHubReleaseDto>)releases);
    }

    public AppVersion GetCurrentVersion()
    {
        Assembly assembly = Assembly.GetExecutingAssembly();

        return new AppVersion {
            FileVersion = assembly.GetCustomAttribute<AssemblyFileVersionAttribute>()?.Version ?? "0.0",
            InformationalVersion = assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? "0.0",
        };
    }
}
