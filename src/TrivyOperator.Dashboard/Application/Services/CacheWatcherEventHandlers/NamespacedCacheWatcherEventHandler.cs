using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers;

public class
    NamespacedCacheWatcherEventHandler<TKubernetesEventDispatcher, TKubernetesWatcher, TKubernetesObject>(
        TKubernetesEventDispatcher kubernetesEventDispatcher,
        TKubernetesWatcher kubernetesWatcher,
        ILogger<NamespacedCacheWatcherEventHandler<TKubernetesEventDispatcher, TKubernetesWatcher,
            TKubernetesObject>> logger)
    : CacheWatcherEventHandler<TKubernetesEventDispatcher, TKubernetesWatcher,
            TKubernetesObject>(kubernetesEventDispatcher, kubernetesWatcher, logger),
        INamespacedCacheWatcherEventHandler
    where TKubernetesEventDispatcher : IKubernetesEventDispatcher<TKubernetesObject>
    where TKubernetesWatcher : INamespacedWatcher<TKubernetesObject>
    where TKubernetesObject : class, IKubernetesObject<V1ObjectMeta>
{
    public async Task Stop(CancellationToken cancellationToken, string watcherKey)
    {
        Logger.LogDebug("Removing Watcher for {kubernetesObjectType} - {watcherKey}.", typeof(TKubernetesObject).Name, watcherKey);
        await KubernetesWatcher.Delete(watcherKey, cancellationToken);
    }

    public async Task ReconcileWatchers(string[] newNamespaceNames, CancellationToken cancellationToken)
    {
        await KubernetesWatcher.ReconcileNamespaces(newNamespaceNames, cancellationToken);
    }
}
