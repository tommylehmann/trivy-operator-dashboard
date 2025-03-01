using TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherStates.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services;

public class CacheWatcherEventHandlerHostedService(
    IEnumerable<IClusterScopedCacheWatcherEventHandler> services,
    IWatcherState watcherState,
    ILogger<CacheWatcherEventHandlerHostedService> logger) : BackgroundService
{
    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Kubernetes Watcher Hosted Service is stopping.");
        await base.StopAsync(stoppingToken);
    }

    protected override Task ExecuteAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Kubernetes Watcher Hosted Service started.");
        watcherState.StartEventsProcessing(cancellationToken);
        foreach (IClusterScopedCacheWatcherEventHandler service in services)
        {
            service.Start(cancellationToken);
        }

        return Task.CompletedTask;
    }
}
