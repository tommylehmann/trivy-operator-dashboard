using TrivyOperator.Dashboard.Application.Services.KubernetesEventCoordinators.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services;

public class KubernetesEventCoordinatorsHandlerHostedService(
    IEnumerable<IClusterScopedKubernetesEventCoordinator> services,
    ILogger<KubernetesEventCoordinatorsHandlerHostedService> logger) : BackgroundService
{
    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Kubernetes Watcher Hosted Service is stopping.");
        await base.StopAsync(stoppingToken);
    }

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Kubernetes Watcher Hosted Service started.");
        foreach (IClusterScopedKubernetesEventCoordinator service in services)
        {
            await service.Start(cancellationToken);
        }
    }
}
