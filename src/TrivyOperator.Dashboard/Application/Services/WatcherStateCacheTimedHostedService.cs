using Microsoft.Extensions.Options;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services;

public class WatcherStateCacheTimedHostedService(
    IConcurrentCache<string, WatcherStateInfo> cache,
    IServiceProvider serviceProvider,
    IOptions<WatchersOptions> options,
    ILogger<WatcherStateCacheTimedHostedService> logger) : IHostedService, IDisposable
{
    private Timer? timer;
    private readonly int timeFrameInSeconds = (int)(options.Value.WatchTimeoutInSeconds * 1.1 + 60);
    
    public Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Watcher State Cache Timed Hosted Service is running.");
        timer = new Timer(async state => await DoWorkAsync(cancellationToken),
            null, TimeSpan.Zero, TimeSpan.FromMinutes(1)); 
        return Task.CompletedTask;
    }

    private async Task DoWorkAsync(CancellationToken cancellationToken)
    {
        try
        {
            IEnumerable<WatcherStateInfo> expiredWatcherStates = cache
                .Select(kvp => kvp.Value)
                .Where(x => (DateTime.Now - x.LastEventMoment).TotalSeconds > timeFrameInSeconds) ?? [];

            foreach (WatcherStateInfo expiredWatcherState in expiredWatcherStates)
            {
                Type clusteredScopedWatcherType = typeof(IClusterScopedWatcher<>).MakeGenericType(expiredWatcherState.WatchedKubernetesObjectType);
                Type namespacedWatcherType = typeof(INamespacedWatcher<>).MakeGenericType(expiredWatcherState.WatchedKubernetesObjectType);

                object? watcherService = serviceProvider.GetServices(clusteredScopedWatcherType).FirstOrDefault()
                    ?? serviceProvider.GetServices(namespacedWatcherType).FirstOrDefault();

                if (watcherService is IKubernetesWatcher watcher)
                {
                    await watcher.Recreate(cancellationToken, expiredWatcherState.WatcherKey);
                }
            }
        }
        catch(Exception ex)
        {
            logger.LogError(ex, "Crashed.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Timed Hosted Service is stopping.");
        timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        timer?.Dispose();
        GC.SuppressFinalize(this);
    }
}
