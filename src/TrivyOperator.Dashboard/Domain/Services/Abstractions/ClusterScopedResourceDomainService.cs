using k8s.Models;
using k8s;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using k8s.Autorest;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;

public abstract class ClusterScopedResourceDomainService<TKubernetesObject, TKubernetesObjectList>(
    IKubernetesClientFactory kubernetesClientFactory)
    : KubernetesResourceDomainService<TKubernetesObject>(kubernetesClientFactory)
    , IClusterScopedResourceDomainService<TKubernetesObject, TKubernetesObjectList>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>, IMetadata<V1ObjectMeta>
    where TKubernetesObjectList : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
{
    public override async Task<IList<TKubernetesObject>> GetResources()
    {
        return (await GetResourceList()).Items;
    }

    public abstract Task<TKubernetesObjectList> GetResourceList(int? pageLimit = null, string? continueToken = null);

    public abstract Task<TKubernetesObject> GetResource(string resourceName);

    public abstract Task<HttpOperationResponse<TKubernetesObjectList>> GetResourceWatchList(
        string? lastResourceVersion = null,
        int? timeoutSeconds = null,
        CancellationToken cancellationToken = new());
}
