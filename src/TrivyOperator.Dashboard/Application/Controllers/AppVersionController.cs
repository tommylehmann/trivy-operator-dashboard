using Microsoft.AspNetCore.Mvc;
using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.AppVersions.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Clients.Models;
using YamlDotNet.Core.Tokens;

namespace TrivyOperator.Dashboard.Application.Controllers;

[ApiController]
[Route("api/app-versions")]
public class AppVersionController(IAppVersionService appVersionService)
{
    [HttpGet(Name = "GetGitHubVersions")]
    [ProducesResponseType<IEnumerable<GitHubRelease>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
    public async Task<IEnumerable<GitHubRelease>> GetAll()
    {
        return await appVersionService.GetTrivyDashboardReleases() ?? [];
    }

    [HttpGet("latest", Name = "GetGitHubLatestVersion")]
    [ProducesResponseType<GitHubRelease>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
    public async Task<GitHubRelease> GetLatest()
    {
        return await appVersionService.GetTrivyDashboardLatestRelease() ?? new GitHubRelease();
    }

    [HttpGet("trivy-operator-latest", Name = "GetTrivyOperatorGitHubLatestVersion")]
    [ProducesResponseType<GitHubRelease>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
    public async Task<GitHubRelease> GetTrivyOperatorLatest()
    {
        return await appVersionService.GetTrivyOperatorLatestRelease() ?? new GitHubRelease();
    }

    [HttpGet("current-version", Name = "GetCurrentVersion")]
    [ProducesResponseType<AppVersion>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
    public AppVersion GetCurrentAppVersion()
    {
        return appVersionService.GetCurrentVersion();
    }

    // TODO - proper error handling with Task<IActionResult>
    // TODO - proper version return (and also, in GitHubClient, user agent
}
