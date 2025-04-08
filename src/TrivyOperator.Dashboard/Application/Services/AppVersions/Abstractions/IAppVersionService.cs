using TrivyOperator.Dashboard.Infrastructure.Clients.Models;

namespace TrivyOperator.Dashboard.Application.Services.AppVersions.Abstractions;
public interface IAppVersionService
{
    Task<GitHubRelease?> GetTrivyDashboardLatestRelease();
    Task<GitHubRelease[]?> GetTrivyDashboardReleases();
    Task<GitHubRelease?> GetTrivyOperatorLatestRelease();
}