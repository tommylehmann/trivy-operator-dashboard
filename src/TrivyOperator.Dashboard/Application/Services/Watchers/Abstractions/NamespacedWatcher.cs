using k8s;
using k8s.Autorest;
using k8s.Models;
using Polly;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

public class
    NamespacedWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>(
        INamespacedResourceWatchDomainService<TKubernetesObject, TKubernetesObjectList> namespacedResourceWatchDomainService,
        TBackgroundQueue backgroundQueue,
        IServiceProvider serviceProvider,
        AsyncPolicy retryPolicy,
        ILogger<NamespacedWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>>
            logger)
    : KubernetesWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>(
        backgroundQueue,
        serviceProvider,
        retryPolicy,
        logger), INamespacedWatcher<TKubernetesObject>
    where TKubernetesObject : class, IKubernetesObject<V1ObjectMeta>, new()
    where TKubernetesObjectList : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
    where TKubernetesWatcherEvent : IWatcherEvent<TKubernetesObject>, new()
    where TBackgroundQueue : IBackgroundQueue<TKubernetesObject>
{
    public void Delete(IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject)
    {
        string sourceNamespace = GetNamespaceFromSourceEvent(sourceKubernetesObject);
        logger.LogInformation(
            "Deleting Watcher for {kubernetesObjectType} and key {watcherKey}.",
            typeof(TKubernetesObject).Name,
            sourceNamespace);
        if (Watchers.TryGetValue(sourceNamespace, out TaskWithCts taskWithCts))
        {
            taskWithCts.Cts.Cancel();
            // TODO: do I have to wait for Task.IsCanceled?
            Watchers.Remove(sourceNamespace);
        }
    }

    protected override Task<HttpOperationResponse<TKubernetesObjectList>> GetKubernetesObjectWatchList(
        IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject,
        string? lastResourceVersion,
        CancellationToken? cancellationToken)
        => namespacedResourceWatchDomainService.GetResourceWatchList(
            GetNamespaceFromSourceEvent(sourceKubernetesObject),
            lastResourceVersion,
            GetWatcherRandomTimeout(),
            cancellationToken);

    protected override async Task EnqueueWatcherEventWithError(IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject)
    {
        TKubernetesObject kubernetesObject = new()
        {
            Metadata = new V1ObjectMeta
            {
                Name = "fakeObject",
                NamespaceProperty = GetNamespaceFromSourceEvent(sourceKubernetesObject),
            },
        };
        TKubernetesWatcherEvent watcherEvent =
            new() { KubernetesObject = kubernetesObject, WatcherEventType = WatchEventType.Error };

        await BackgroundQueue.QueueBackgroundWorkItemAsync(watcherEvent);
    }

    protected override async Task<TKubernetesObjectList> GetInitialResources(IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject, string? continueToken, CancellationToken? cancellationToken = null)
    {
        string namespaceName = GetNamespaceFromSourceEvent(sourceKubernetesObject);

        return await namespacedResourceWatchDomainService.GetResourceList(namespaceName, resourceListPageSize, continueToken, cancellationToken);
    }
}
