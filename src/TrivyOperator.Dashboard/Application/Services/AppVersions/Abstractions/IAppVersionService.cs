using TrivyOperator.Dashboard.Application.Models;

namespace TrivyOperator.Dashboard.Application.Services.AppVersions.Abstractions;
public interface IAppVersionService
{
    Task<GitHubReleaseDto?> GetTrivyDashboardLatestRelease();
    Task<IList<GitHubReleaseDto>> GetTrivyDashboardReleases();
    AppVersion GetCurrentVersion();
}