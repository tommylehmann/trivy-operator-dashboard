using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.KubernetesEventCoordinators.Abstractions;

public interface INamespacedKubernetesEventCoordinator : IKubernetesEventCoordinator
{
    Task Stop(CancellationToken cancellationToken, string watcherKey = CacheUtils.DefaultCacheRefreshKey);
    Task ReconcileWatchers(string[] newNamespaceNames, CancellationToken cancellationToken);
}
