using k8s;
using k8s.Autorest;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

public class NamespacedWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>(
    INamespacedResourceWatchDomainService<TKubernetesObject, TKubernetesObjectList>
        namespacedResourceWatchDomainService,
    TBackgroundQueue backgroundQueue,
    IBackgroundQueue<WatcherStateInfo> backgroundQueueWatcherState,
    ILogger<NamespacedWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>>
        logger)
    : KubernetesWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>(
        backgroundQueue,
        backgroundQueueWatcherState,
        logger), INamespacedWatcher<TKubernetesObject>
    where TKubernetesObject : class, IKubernetesObject<V1ObjectMeta>, new()
    where TKubernetesObjectList : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
    where TKubernetesWatcherEvent : IWatcherEvent<TKubernetesObject>, new()
    where TBackgroundQueue : IKubernetesBackgroundQueue<TKubernetesObject>
{
    

    protected override Task<HttpOperationResponse<TKubernetesObjectList>> GetKubernetesObjectWatchList(
        string watcherKey,
        string? lastResourceVersion,
        CancellationToken? cancellationToken) => namespacedResourceWatchDomainService.GetResourceWatchList(
        watcherKey,
        lastResourceVersion,
        GetWatcherRandomTimeout(),
        cancellationToken);

    protected override async Task EnqueueWatcherEventWithError(string watcherKey)
    {
        TKubernetesObject kubernetesObject = new()
        {
            Metadata = new V1ObjectMeta
            {
                Name = "fakeObject",
                NamespaceProperty = watcherKey,
            },
        };
        TKubernetesWatcherEvent watcherEvent =
            new() { KubernetesObject = kubernetesObject, WatcherEventType = WatchEventType.Error };

        await BackgroundQueue.QueueBackgroundWorkItemAsync(watcherEvent);
    }

    protected override async Task<TKubernetesObjectList> GetInitialResources(
        string watcherKey,
        string? continueToken,
        CancellationToken? cancellationToken = null)
    {
        return await namespacedResourceWatchDomainService.GetResourceList(
            watcherKey,
            resourceListPageSize,
            continueToken,
            cancellationToken);
    }
}
