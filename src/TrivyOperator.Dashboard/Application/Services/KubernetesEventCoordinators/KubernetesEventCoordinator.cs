using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventCoordinators.Abstractions;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.KubernetesEventCoordinators;

public class
    KubernetesEventCoordinator<TKubernetesEventDispatcher, TKubernetesWatcher, TKubernetesObject>(
        TKubernetesEventDispatcher kubernetesEventDispatcher,
        TKubernetesWatcher kubernetesWatcher,
        ILogger<KubernetesEventCoordinator<TKubernetesEventDispatcher, TKubernetesWatcher,
            TKubernetesObject>> logger)
    : IKubernetesEventCoordinator
    where TKubernetesEventDispatcher : IKubernetesEventDispatcher<TKubernetesObject>
    where TKubernetesWatcher : IKubernetesWatcher<TKubernetesObject>
    where TKubernetesObject : class, IKubernetesObject<V1ObjectMeta>
{
    protected readonly TKubernetesEventDispatcher KubernetesEventDispatcher = kubernetesEventDispatcher;
    protected readonly TKubernetesWatcher KubernetesWatcher = kubernetesWatcher;

    protected readonly ILogger<KubernetesEventCoordinator<TKubernetesEventDispatcher, TKubernetesWatcher,
            TKubernetesObject>> Logger = logger;

    public async Task Start(
        CancellationToken cancellationToken,
        string watcherKey = VarUtils.DefaultCacheRefreshKey)
    {
        Logger.LogDebug("Adding Watcher for {kubernetesObjectType} - {watcherKey}.", typeof(TKubernetesObject).Name, watcherKey);
        await KubernetesWatcher.Add(cancellationToken, watcherKey);
        if (!KubernetesEventDispatcher.IsQueueProcessingStarted)
        {
            Logger.LogDebug("Adding CacheRefresher for {kubernetesObjectType}.", typeof(TKubernetesObject).Name);
            KubernetesEventDispatcher.StartEventsProcessing(cancellationToken);
        }
    }
}
