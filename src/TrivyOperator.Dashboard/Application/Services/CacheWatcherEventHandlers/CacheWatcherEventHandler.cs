using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.CacheRefresh.Abstractions;
using TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers;

public class
    CacheWatcherEventHandler<TBackgroundQueue, TCacheRefresh, TKubernetesWatcher,
        TKubernetesObject>(
        TCacheRefresh cacheRefresh,
        TKubernetesWatcher kubernetesWatcher,
        ILogger<CacheWatcherEventHandler<TBackgroundQueue, TCacheRefresh, TKubernetesWatcher,
            TKubernetesObject>> logger)
    : ICacheWatcherEventHandler
    where TBackgroundQueue : IKubernetesBackgroundQueue<TKubernetesObject>
    where TCacheRefresh : ICacheRefresh<TKubernetesObject, TBackgroundQueue>
    where TKubernetesWatcher : IKubernetesWatcher<TKubernetesObject>
    where TKubernetesObject : class, IKubernetesObject<V1ObjectMeta>
{
    protected readonly TCacheRefresh CacheRefresh = cacheRefresh;
    protected readonly TKubernetesWatcher KubernetesWatcher = kubernetesWatcher;

    protected readonly
        ILogger<CacheWatcherEventHandler<TBackgroundQueue, TCacheRefresh, TKubernetesWatcher,
            TKubernetesObject>> Logger = logger;


    public void Start(
        CancellationToken cancellationToken,
        string watcherKey = VarUtils.DefaultCacheRefreshKey)
    {
        Logger.LogDebug("Adding Watcher for {kubernetesObjectType} - {watcherKey}.", typeof(TKubernetesObject).Name, watcherKey);
        KubernetesWatcher.Add(cancellationToken, watcherKey);
        if (!CacheRefresh.IsQueueProcessingStarted())
        {
            Logger.LogDebug("Adding CacheRefresher for {kubernetesObjectType}.", typeof(TKubernetesObject).Name);
            CacheRefresh.StartEventsProcessing(cancellationToken);
        }
    }
}
