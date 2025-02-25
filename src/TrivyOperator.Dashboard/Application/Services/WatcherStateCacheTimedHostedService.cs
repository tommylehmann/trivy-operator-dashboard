using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services;

public class WatcherStateCacheTimedHostedService(
    IConcurrentCache<string, WatcherStateInfo> cache,
    IServiceProvider serviceProvider,
    ILogger<WatcherStateCacheTimedHostedService> logger) : IHostedService, IDisposable
{
    private Timer? timer;
    private readonly int timeFrameInMinutes = 6;
    private CancellationToken? ct;
    
    public Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Timed Hosted Service running.");
        ct = cancellationToken;
        timer = new Timer(async void (_) =>
        {
            await DoWorkAsync();
        }, null, TimeSpan.Zero, TimeSpan.FromMinutes(timeFrameInMinutes)); // TODO: use consistent timeout with Watcher one, from appsettings
        return Task.CompletedTask;
    }

    private async Task DoWorkAsync()
    {
        try
        {
            IEnumerable<WatcherStateInfo> expiredWatcherStates = cache.Select(kvp => kvp.Value).Where(x => (DateTime.Now - x.LastEventMoment).TotalMinutes > timeFrameInMinutes) ?? [];

            foreach (WatcherStateInfo expiredWatcherState in expiredWatcherStates)
            {
                Type clusteredScopedWatcherType = typeof(IClusterScopedWatcher<>).MakeGenericType(expiredWatcherState.WatchedKubernetesObjectType);
                Type namespacedWatcherType = typeof(INamespacedWatcher<>).MakeGenericType(expiredWatcherState.WatchedKubernetesObjectType);

                object? watcherService = serviceProvider.GetServices(clusteredScopedWatcherType).FirstOrDefault()
                    ?? serviceProvider.GetServices(namespacedWatcherType).FirstOrDefault();

                if (watcherService is IKubernetesWatcher watcher)
                {
                    await watcher.Recreate(ct ?? CancellationToken.None, expiredWatcherState.WatcherKey);
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
