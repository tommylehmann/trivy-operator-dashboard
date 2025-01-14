using k8s.Autorest;
using k8s.Models;
using Microsoft.Extensions.Options;
using System.Net;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services;

public class StaticNamespaceDomainService(
    IOptions<KubernetesOptions> kubernetesOptions,
    ILogger<StaticNamespaceDomainService> logger)
    : IClusterScopedResourceQueryDomainService<V1Namespace, V1NamespaceList>
{
    public Task<IList<V1Namespace>> GetResources(CancellationToken? cancellationToken = null)
    {
        string? configKubernetesNamespaces = kubernetesOptions.Value.NamespaceList;

        if (string.IsNullOrWhiteSpace(configKubernetesNamespaces))
        {
            throw new ArgumentNullException(
                "Provided parameter Kubernetes.NamespaceList is null or whitespace.",
                (Exception?)null);
        }

        List<V1Namespace> kubernetesNamespaces = configKubernetesNamespaces
            .Split(',')
            .Select(namespaceName =>
            {
                return CreateNamespace(namespaceName.Trim());
            }
            ).ToList();
        logger.LogDebug("Found {listCount} kubernetes namespace names.", kubernetesNamespaces.Count);

        return Task.FromResult<IList<V1Namespace>>(kubernetesNamespaces);
    }
    public Task<V1Namespace> GetResource(string resourceName, CancellationToken? cancellationToken = null)
    {
        return Task.FromResult(CreateNamespace(resourceName));
    }
    public Task<V1NamespaceList> GetResourceList(int? pageLimit = null, string? continueToken = null, CancellationToken? cancellationToken = null)
    {
        return Task.FromResult(new V1NamespaceList
        {
            ApiVersion = "v1",
            Kind = "NamespaceList",
            Metadata = new V1ListMeta
            {
                ResourceVersion = "1",
            },
            Items = GetResources().Result,
        });
    }
    // failed attempt to implement this method. will not work for a "kubernetes watch" scenario.
    //public Task<HttpOperationResponse<V1NamespaceList>> GetResourceWatchList(
    //    string? lastResourceVersion = null,
    //    int? timeoutSeconds = null,
    //    CancellationToken cancellationToken = default)
    //{
    //    TaskCompletionSource<HttpOperationResponse<V1NamespaceList>> tcs = new();
    //    V1NamespaceList v1NamespaceList = string.IsNullOrWhiteSpace(lastResourceVersion)
    //        ? new V1NamespaceList()
    //        : GetResourceList().Result;
    //    HttpResponseMessage responseMessage = new(HttpStatusCode.OK)
    //    {
    //        Content = new StringContent("{}")
    //    };
    //    HttpOperationResponse<V1NamespaceList> response = new()
    //    {
    //        Body = new V1NamespaceList(),
    //        Response = responseMessage
    //    };
    //    Task.Delay(timeoutSeconds * 1000 ?? 6000, cancellationToken).ContinueWith(_ => tcs.SetResult(response), cancellationToken);

    //    return tcs.Task;
    //}
    private static V1Namespace CreateNamespace(string namespaceName)
    {
        return new V1Namespace
        {
            ApiVersion = "v1",
            Kind = "Namespace",
            Metadata = new V1ObjectMeta
            {
                Name = namespaceName,
            }
        };
    }
}
