using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.CacheRefresh.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;

public class
    CacheWatcherEventHandler<TBackgroundQueue, TCacheRefresh, TKubernetesWatcherEvent, TKubernetesWatcher,
        TKubernetesObject>(
        TCacheRefresh cacheRefresh,
        TKubernetesWatcher kubernetesWatcher,
        ILogger<CacheWatcherEventHandler<TBackgroundQueue, TCacheRefresh, TKubernetesWatcherEvent, TKubernetesWatcher,
            TKubernetesObject>> logger)
    : ICacheWatcherEventHandler where TBackgroundQueue : IBackgroundQueue<TKubernetesObject>
    where TCacheRefresh : ICacheRefresh<TKubernetesObject, TBackgroundQueue>
    where TKubernetesWatcherEvent : class, IWatcherEvent<TKubernetesObject>, new()
    where TKubernetesWatcher : IKubernetesWatcher<TKubernetesObject>
    where TKubernetesObject : class, IKubernetesObject<V1ObjectMeta>
{
    protected readonly TCacheRefresh CacheRefresh = cacheRefresh;
    protected readonly TKubernetesWatcher KubernetesWatcher = kubernetesWatcher;

    protected readonly
        ILogger<CacheWatcherEventHandler<TBackgroundQueue, TCacheRefresh, TKubernetesWatcherEvent, TKubernetesWatcher,
            TKubernetesObject>> Logger = logger;


    public void Start(
        CancellationToken cancellationToken,
        IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject = null)
    {
        Logger.LogDebug("Adding Watcher for {kubernetesObjectType}.", typeof(TKubernetesObject).Name);
        KubernetesWatcher.Add(cancellationToken, sourceKubernetesObject);
        if (!CacheRefresh.IsQueueProcessingStarted())
        {
            Logger.LogDebug("Adding CacheRefresher for {kubernetesObjectType}.", typeof(TKubernetesObject).Name);
            CacheRefresh.StartEventsProcessing(cancellationToken);
        }
    }
}
