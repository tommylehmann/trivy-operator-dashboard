namespace TrivyOperator.Dashboard.Application.Services.Options;

public class GitHubOptions
{
    public string BaseTrivyDashboardRepoUrl { get; set; } = "https://api.github.com/repos/raoulx24/trivy-operator-dashboard";
    public string BaseTrivyOperatorRepoUrl { get; set; } = "https://api.github.com/repos/aquasecurity/trivy-operator";
    public bool ServerCheckForUpdates { get; set; } = true;
    public int CheckForUpdatesIntervalInMinutes { get; set; } = 360;
}
