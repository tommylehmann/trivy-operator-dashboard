using k8s;
using k8s.Autorest;
using k8s.Models;
using System.Net;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services;

public class NamespaceDomainService(
    IKubernetesClientFactory kubernetesClientFactory,
    ILogger<NamespaceDomainService> logger)
    : ClusterScopedResourceDomainService<V1Namespace, V1NamespaceList>(kubernetesClientFactory)
{
    public override async Task<V1Namespace> GetResource(string resourceName, CancellationToken? cancellationToken = null)
    {
        return await kubernetesClientFactory.GetClient().CoreV1.ReadNamespaceAsync(resourceName, cancellationToken: cancellationToken ?? new());
    }
    public override async Task<V1NamespaceList> GetResourceList(int? pageLimit = null, string? continueToken = null, CancellationToken? cancellationToken = null)
    {
        try
        {
            return await kubernetesClientFactory.GetClient().CoreV1.ListNamespaceAsync(
                limit: pageLimit,
                continueParameter: continueToken,
                cancellationToken: cancellationToken ?? new());
        }
        catch (HttpOperationException ex) when (ex.Response.StatusCode == HttpStatusCode.Forbidden)
        {
            logger.LogWarning(
                ex,
                "Cannot get Kubernetes Namespaces. Forbidden (403). Error: {responseContent}",
                ex.Response.Content);
            return new() { Items = [] };
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "Cannot get Kubernetes Namespaces. Error {exceptionMessage}", ex.Message);
            throw;
        }
    }
    public override Task<HttpOperationResponse<V1NamespaceList>> GetResourceWatchList(
        string? lastResourceVersion = null,
        int? timeoutSeconds = null,
        CancellationToken? cancellationToken = null)
    {
        return kubernetesClientFactory.GetClient()
            .CoreV1.ListNamespaceWithHttpMessagesAsync(
                watch: true,
                resourceVersion: lastResourceVersion,
                allowWatchBookmarks: true,
                timeoutSeconds: timeoutSeconds,
                cancellationToken: cancellationToken ?? new());
    }
}
