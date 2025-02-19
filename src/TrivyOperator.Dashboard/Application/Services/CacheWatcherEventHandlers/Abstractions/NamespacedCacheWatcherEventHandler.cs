using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.CacheRefresh.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;

public class
    NamespacedCacheWatcherEventHandler<TBackgroundQueue, TCacheRefresh, TKubernetesWatcherEvent, TKubernetesWatcher,
        TKubernetesObject>(
        TCacheRefresh cacheRefresh,
        TKubernetesWatcher kubernetesWatcher,
        ILogger<CacheWatcherEventHandler<TBackgroundQueue, TCacheRefresh, TKubernetesWatcherEvent, TKubernetesWatcher,
            TKubernetesObject>> logger)
    : CacheWatcherEventHandler<TBackgroundQueue, TCacheRefresh, TKubernetesWatcherEvent, TKubernetesWatcher,
            TKubernetesObject>(cacheRefresh, kubernetesWatcher, logger),
        INamespacedCacheWatcherEventHandler where TBackgroundQueue : IKubernetesBackgroundQueue<TKubernetesObject>
    where TCacheRefresh : ICacheRefresh<TKubernetesObject, TBackgroundQueue>
    where TKubernetesWatcherEvent : class, IWatcherEvent<TKubernetesObject>, new()
    where TKubernetesWatcher : INamespacedWatcher<TKubernetesObject>
    where TKubernetesObject : class, IKubernetesObject<V1ObjectMeta>
{
    public void Stop(IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject = null)
    {
        Logger.LogDebug("Removing Watcher for {kubernetesObjectType}.", typeof(TKubernetesObject).Name);
        KubernetesWatcher.Delete(sourceKubernetesObject);
    }
}
