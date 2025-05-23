using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventCoordinators.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.CacheRefreshers;

public class NamespaceCacheRefresher(
    IListConcurrentCache<V1Namespace> cache,
    IEnumerable<INamespacedKubernetesEventCoordinator> services,
    ILogger<NamespaceCacheRefresher> logger)
    : CacheRefresher<V1Namespace>(cache, logger)
{
    protected override void ProcessAddEvent(
        IWatcherEvent<V1Namespace> watcherEvent,
        CancellationToken cancellationToken)
    {
        if (watcherEvent.KubernetesObject == null)
        {
            logger.LogWarning("ProcessAddEvent - KubernetesObject is null for {watcherKey} - {kubernetesObjectType}. Ignoring",
                watcherEvent.WatcherKey, typeof(V1Namespace).Name);
            return;
        }

        base.ProcessAddEvent(watcherEvent, cancellationToken);
        foreach (INamespacedKubernetesEventCoordinator service in services)
        {
            service.Start(cancellationToken, watcherEvent.KubernetesObject.Metadata.Name);
        }
    }

    protected override async Task ProcessDeleteEvent(IWatcherEvent<V1Namespace> watcherEvent, CancellationToken cancellationToken)
    {
        if (watcherEvent.KubernetesObject == null)
        {
            logger.LogWarning("ProcessDeleteEvent - KubernetesObject is null for {watcherKey} - {kubernetesObjectType}. Ignoring",
                watcherEvent.WatcherKey, typeof(V1Namespace).Name);
            return;
        }

        await base.ProcessDeleteEvent(watcherEvent, cancellationToken);
        IEnumerable<Task> tasks = services.Select(s => s.Stop(cancellationToken, watcherEvent.KubernetesObject.Metadata.Name));
        await Task.WhenAll(tasks);
    }

    protected override async Task ProcessInitEvent(IWatcherEvent<V1Namespace> watcherEvent, CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(VarUtils.DefaultCacheRefreshKey, out IList<V1Namespace>? namespaceNames))
        {
            string[] newNamespaceNames = namespaceNames.Select(x => x.Metadata.Name).ToArray();
            IEnumerable<Task> tasks = services.Select(s => s.ReconcileWatchers(newNamespaceNames, cancellationToken));
            await Task.WhenAll(tasks);
        }
    }
    // TODO: new for ns cleanup
}
