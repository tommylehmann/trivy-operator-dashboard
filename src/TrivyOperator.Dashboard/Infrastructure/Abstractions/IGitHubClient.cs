using TrivyOperator.Dashboard.Infrastructure.Clients.Models;

namespace TrivyOperator.Dashboard.Infrastructure.Abstractions;
public interface IGitHubClient
{
    Task<GitHubRelease?> GetLatestRelease(string baseRepoUrl);
    Task<GitHubRelease[]?> GitHubReleases(string baseRepoUrl);
}