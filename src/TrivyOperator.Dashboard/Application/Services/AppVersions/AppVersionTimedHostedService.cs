using Microsoft.Extensions.Options;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Clients.Models;

namespace TrivyOperator.Dashboard.Application.Services.AppVersions;

public class AppVersionTimedHostedService(
    IGitHubClient gitHubClient, 
    IOptions<GitHubOptions> options,
    IConcurrentCache<long, GitHubRelease> cache,
    ILogger<AppVersionService> logger)
    : IHostedService, IDisposable
{
    private readonly int timeFrameInMinutes = (int)(options.Value.CheckForUpdatesIntervalInMinutes);
    private bool disposed;
    private Task? executingTask;
    private CancellationTokenSource? stoppingCts;
    private Timer? timer;

    public Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Watcher State Cache Timed Hosted Service is starting.");

        stoppingCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timer = new Timer(Execute, null, TimeSpan.Zero, TimeSpan.FromMinutes(timeFrameInMinutes));

        return Task.CompletedTask;
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Watcher State Cache Timed Hosted Service is stopping.");

        timer?.Change(Timeout.Infinite, 0);

        if (executingTask == null || executingTask.IsCompleted)
        {
            return;
        }

        try
        {
            stoppingCts!.Cancel();
        }
        finally
        {
            await executingTask.WaitAsync(cancellationToken).ConfigureAwait(ConfigureAwaitOptions.SuppressThrowing);
        }
    }

    private void Execute(object? state)
    {
        if (executingTask == null || executingTask.IsCompleted)
        {
            executingTask = ExecuteAsync(stoppingCts?.Token ?? CancellationToken.None);
        }
        else
        {
            logger.LogInformation(
                "Watcher State Cache Timed Hosted Service is still running previous execution, wait for next cycle."
            );
        }
    }

    private async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        try
        {
            GitHubRelease[]? releases = await gitHubClient.GitHubReleases(options.Value.BaseTrivyDashboardRepoUrl, cancellationToken);
            if (releases is null)
            {
                logger.LogWarning("Failed to fetch releases from GitHub.");
                return;
            }
            GitHubRelease? latestReslease = await gitHubClient.GetLatestRelease(options.Value.BaseTrivyDashboardRepoUrl, cancellationToken);
            if (latestReslease != null)
            {
                var release = releases.FirstOrDefault(x => x.Id == latestReslease.Id);
                if (release != null)
                {
                    release.IsLatest = true;
                }
            }
            cache.Clear();
            foreach (var release in releases)
            {
                cache.TryAdd(release.Id, release);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while executing the timed hosted service.");
        }
    }

    public void Dispose()
    {
        Dispose(true);

        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!disposed)
        {
            if (disposing)
            {
                timer?.Dispose();
                stoppingCts?.Cancel();
            }

            disposed = true;
        }
    }
}
