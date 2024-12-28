using k8s;
using k8s.Autorest;
using k8s.Models;
using Polly;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Watchers;

public class NamespaceWatcher(
    IKubernetesClientFactory kubernetesClientFactory,
    IBackgroundQueue<V1Namespace> backgroundQueue,
    IServiceProvider serviceProvider,
    AsyncPolicy retryPolicy,
    ILogger<NamespaceWatcher> logger)
    : ClusterScopedWatcher<V1NamespaceList, V1Namespace, IBackgroundQueue<V1Namespace>, WatcherEvent<V1Namespace>>(
        kubernetesClientFactory,
        backgroundQueue,
        serviceProvider,
        retryPolicy,
        logger)
{
    protected override async Task<HttpOperationResponse<V1NamespaceList>> GetKubernetesObjectWatchList(
        IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject,
        string? lastResourceVersion,
        CancellationToken cancellationToken) => 
            await KubernetesClient.CoreV1.ListNamespaceWithHttpMessagesAsync(
            watch: true,
            resourceVersion: lastResourceVersion,
            allowWatchBookmarks: true,
            timeoutSeconds: GetWatcherRandomTimeout(),
            cancellationToken: cancellationToken);
}
