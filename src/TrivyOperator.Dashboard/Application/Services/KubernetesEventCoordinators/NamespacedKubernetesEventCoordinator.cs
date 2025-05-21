using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventCoordinators.Abstractions;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.KubernetesEventCoordinators;

public class
    NamespacedKubernetesEventCoordinator<TKubernetesEventDispatcher, TKubernetesWatcher, TKubernetesObject>(
        TKubernetesEventDispatcher kubernetesEventDispatcher,
        TKubernetesWatcher kubernetesWatcher,
        ILogger<NamespacedKubernetesEventCoordinator<TKubernetesEventDispatcher, TKubernetesWatcher,
            TKubernetesObject>> logger)
    : KubernetesEventCoordinator<TKubernetesEventDispatcher, TKubernetesWatcher,
            TKubernetesObject>(kubernetesEventDispatcher, kubernetesWatcher, logger),
        INamespacedKubernetesEventCoordinator
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
