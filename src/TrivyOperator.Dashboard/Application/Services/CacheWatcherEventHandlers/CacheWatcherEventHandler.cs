using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers;

public class
    CacheWatcherEventHandler<TKubernetesEventDispatcher, TKubernetesWatcher, TKubernetesObject>(
        TKubernetesEventDispatcher kubernetesEventDispatcher,
        TKubernetesWatcher kubernetesWatcher,
        ILogger<CacheWatcherEventHandler<TKubernetesEventDispatcher, TKubernetesWatcher,
            TKubernetesObject>> logger)
    : ICacheWatcherEventHandler
    where TKubernetesEventDispatcher : IKubernetesEventDispatcher<TKubernetesObject>
    where TKubernetesWatcher : IKubernetesWatcher<TKubernetesObject>
    where TKubernetesObject : class, IKubernetesObject<V1ObjectMeta>
{
    protected readonly TKubernetesEventDispatcher KubernetesEventDispatcher = kubernetesEventDispatcher;
    protected readonly TKubernetesWatcher KubernetesWatcher = kubernetesWatcher;

    protected readonly ILogger<CacheWatcherEventHandler<TKubernetesEventDispatcher, TKubernetesWatcher,
            TKubernetesObject>> Logger = logger;

    public void Start(
        CancellationToken cancellationToken,
        string watcherKey = VarUtils.DefaultCacheRefreshKey)
    {
        Logger.LogDebug("Adding Watcher for {kubernetesObjectType} - {watcherKey}.", typeof(TKubernetesObject).Name, watcherKey);
        KubernetesWatcher.Add(cancellationToken, watcherKey);
        if (!KubernetesEventDispatcher.IsQueueProcessingStarted)
        {
            Logger.LogDebug("Adding CacheRefresher for {kubernetesObjectType}.", typeof(TKubernetesObject).Name);
            KubernetesEventDispatcher.StartEventsProcessing(cancellationToken);
        }
    }
}
