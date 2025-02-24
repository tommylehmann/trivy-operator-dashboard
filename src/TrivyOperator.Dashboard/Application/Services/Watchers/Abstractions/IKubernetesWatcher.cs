using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

public interface IKubernetesWatcher<TKubernetesObject> where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
{
    Task Add(CancellationToken cancellationToken, string watcherKey = VarUtils.DefaultCacheRefreshKey);
    // do not change Recreate, as it is used in WatcherStateCacheTimedHostedService, dynamic
    Task Recreate(CancellationToken cancellationToken, string watcherKey = VarUtils.DefaultCacheRefreshKey);
}
