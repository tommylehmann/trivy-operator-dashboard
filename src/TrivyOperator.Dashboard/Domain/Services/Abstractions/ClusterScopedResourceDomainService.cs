using k8s;
using k8s.Autorest;
using k8s.Models;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;

public abstract class
    ClusterScopedResourceDomainService<TKubernetesObject, TKubernetesObjectList>(
        IKubernetesClientFactory kubernetesClientFactory)
    : KubernetesResourceDomainService<TKubernetesObject>(kubernetesClientFactory),
        IClusterScopedResourceWatchDomainService<TKubernetesObject, TKubernetesObjectList>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>, IMetadata<V1ObjectMeta>
    where TKubernetesObjectList : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
{
    public override async Task<IList<TKubernetesObject>> GetResources(CancellationToken? cancellationToken = null)
    {
        try
        {
            TKubernetesObjectList kubernetesObjectList = await GetResourceList(cancellationToken: cancellationToken);
            return kubernetesObjectList.Items;
        }
        catch { throw; }
    }

    public abstract Task<TKubernetesObjectList> GetResourceList(
        int? pageLimit = null,
        string? continueToken = null,
        CancellationToken? cancellationToken = null);

    public abstract Task<TKubernetesObject> GetResource(
        string resourceName,
        CancellationToken? cancellationToken = null);

    public abstract Task<HttpOperationResponse<TKubernetesObjectList>> GetResourceWatchList(
        string? lastResourceVersion = null,
        int? timeoutSeconds = null,
        CancellationToken? cancellationToken = null);
}
