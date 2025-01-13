using k8s.Models;
using k8s;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using k8s.Autorest;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;

public abstract class NamespacedResourceDomainService<TKubernetesObject, TKubernetesObjectList>(
    IKubernetesClientFactory kubernetesClientFactory,
    IClusterScopedResourceQueryDomainService<V1Namespace, V1NamespaceList> namespaceDomainService)
    : KubernetesResourceDomainService<TKubernetesObject>(kubernetesClientFactory)
    , INamespacedResourceWatchDomainService<TKubernetesObject, TKubernetesObjectList>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>, IMetadata<V1ObjectMeta>
    where TKubernetesObjectList : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
{
    public async override Task<IList<TKubernetesObject>> GetResources()
    {
        IEnumerable<V1Namespace> v1Namespaces = await namespaceDomainService.GetResources();
        List<TKubernetesObject> trivyReports = [];
        foreach (var v1Namespace in v1Namespaces ?? [])
        {
            IList<TKubernetesObject> trivyReportsInNamespace = await GetResources(v1Namespace.Name());
            trivyReports.AddRange(trivyReportsInNamespace);
        }
        return trivyReports;
    }

    public async Task<IList<TKubernetesObject>> GetResources(string namespaceName)
    {
        return (await GetResourceList(namespaceName)).Items;
    }

    public abstract Task<TKubernetesObjectList> GetResourceList(string namespaceName, int? pageLimit = null, string? continueToken = null);
    public abstract Task<TKubernetesObject> GetResource(string resourceName, string namespaceName);
    public abstract Task<HttpOperationResponse<TKubernetesObjectList>> GetResourceWatchList(
        string namespaceName,
        string? lastResourceVersion = null,
        int? timeoutSeconds = null,
        CancellationToken cancellationToken = new());
}
