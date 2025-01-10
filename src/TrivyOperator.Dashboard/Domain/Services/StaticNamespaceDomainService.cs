using k8s.Autorest;
using k8s.Models;
using Microsoft.Extensions.Options;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services;

public class StaticNamespaceDomainService(
    IKubernetesClientFactory kubernetesClientFactory,
    IOptions<KubernetesOptions> kubernetesOptions,
    ILogger<StaticNamespaceDomainService> logger)
    : ClusterScopedResourceDomainService<V1Namespace, V1NamespaceList>(kubernetesClientFactory)
{
    public override Task<IList<V1Namespace>> GetResources()
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
            .Select(x =>
            {
                return new V1Namespace
                {
                    Metadata = new V1ObjectMeta
                    {
                        Name = x.Trim(),
                    }
                };
            }
            ).ToList();
        logger.LogDebug("Found {listCount} kubernetes namespace names.", kubernetesNamespaces.Count);

        return Task.FromResult<IList<V1Namespace>>(kubernetesNamespaces);
    }
    public override Task<V1Namespace> GetResource(string resourceName)
    {
        return Task.FromResult(new V1Namespace { Metadata = new V1ObjectMeta { Name = resourceName, } });
    }
    public override Task<V1NamespaceList> GetResourceList(int? pageLimit = null, string? continueToken = null) => throw new NotImplementedException();
    public override Task<HttpOperationResponse<V1NamespaceList>> GetResourceWatchList(string? lastResourceVersion = null, int? timeoutSeconds = null, CancellationToken cancellationToken = default) => throw new NotImplementedException();
}
