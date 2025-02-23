using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Watchers;

public class StaticNamespaceWatcher(
    IKubernetesBackgroundQueue<V1Namespace> backgroundQueue,
    IClusterScopedResourceQueryDomainService<V1Namespace, V1NamespaceList> kubernetesNamespaceDomainService,
    ILogger<StaticNamespaceWatcher> logger)
    : IClusterScopedWatcher<V1Namespace>
{
    public async Task Add(CancellationToken cancellationToken, IKubernetesObject<V1ObjectMeta>? sourceKubernetesObjects)
    {
        IList<V1Namespace> kubernetesNamespaces = await kubernetesNamespaceDomainService.GetResources();
        foreach (V1Namespace kubernetesNamespace in kubernetesNamespaces)
        {
            WatcherEvent<V1Namespace> watcherEvent = new()
            {
                KubernetesObject = kubernetesNamespace,
                WatcherEventType = WatchEventType.Added,
            };

            await backgroundQueue.QueueBackgroundWorkItemAsync(watcherEvent);
        }
    }

    public void Delete(IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject)
    {
        logger.LogWarning("Delete called. Ignoring...");
    }
}
