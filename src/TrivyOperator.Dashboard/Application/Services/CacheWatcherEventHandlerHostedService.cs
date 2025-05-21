using TrivyOperator.Dashboard.Application.Services.KubernetesEventCoordinators.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services;

public class CacheWatcherEventHandlerHostedService(
    IEnumerable<IClusterScopedKubernetesEventCoordinator> services,
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
        foreach (IClusterScopedKubernetesEventCoordinator service in services)
        {
            service.Start(cancellationToken);
        }

        return Task.CompletedTask;
    }
}
