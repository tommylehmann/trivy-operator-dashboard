using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.CacheRefresh.Abstractions;
using TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.CacheRefresh;

public class NamespaceCacheRefresh(
    IKubernetesBackgroundQueue<V1Namespace> backgroundQueue,
    IConcurrentCache<string, IList<V1Namespace>> cache,
    IEnumerable<INamespacedCacheWatcherEventHandler> services,
    ILogger<NamespaceCacheRefresh> logger)
    : CacheRefresh<V1Namespace, IKubernetesBackgroundQueue<V1Namespace>>(backgroundQueue, cache, logger)
{
    protected override void ProcessAddEvent(
        IWatcherEvent<V1Namespace> watcherEvent,
        CancellationToken cancellationToken)
    {
        base.ProcessAddEvent(watcherEvent, cancellationToken);
        foreach (INamespacedCacheWatcherEventHandler service in services)
        {
            service.Start(cancellationToken, watcherEvent.KubernetesObject.Metadata.Name);
        }
    }

    protected override void ProcessDeleteEvent(IWatcherEvent<V1Namespace> watcherEvent)
    {
        base.ProcessDeleteEvent(watcherEvent);
        foreach (INamespacedCacheWatcherEventHandler service in services)
        {
            service.Stop(watcherEvent.KubernetesObject.Metadata.Name);
        }
    }
}
