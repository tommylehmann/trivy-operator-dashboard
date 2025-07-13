using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.KubernetesEventCoordinators.Abstractions;

public interface IKubernetesEventCoordinator
{
    Task Start(CancellationToken cancellationToken, string watcherKey = CacheUtils.DefaultCacheRefreshKey);
}
