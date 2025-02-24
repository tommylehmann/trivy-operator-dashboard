using Elasticsearch.Net;
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
    private CancellationToken? cancellationToken;
    public Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Timed Hosted Service running.");
        this.cancellationToken = cancellationToken;
        timer = new Timer(async (e) =>
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
                var clusteredScopedWatcherType = typeof(IClusterScopedWatcher<>).MakeGenericType(expiredWatcherState.WatchedKubernetesObjectType);
                var namespacedWatcherType = typeof(INamespacedWatcher<>).MakeGenericType(expiredWatcherState.WatchedKubernetesObjectType);

                dynamic? aTypeService = serviceProvider.GetServices(clusteredScopedWatcherType).FirstOrDefault()
                    ?? serviceProvider.GetServices(namespacedWatcherType).FirstOrDefault();

                if (aTypeService != null)
                {
                    CancellationToken cancellationToken = this.cancellationToken ?? new();
                    await aTypeService.Recreate(cancellationToken, expiredWatcherState.WatcherKey);
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
