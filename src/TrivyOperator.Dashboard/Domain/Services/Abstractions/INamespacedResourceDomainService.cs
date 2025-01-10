using k8s;
using k8s.Autorest;
using k8s.Models;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;
public interface INamespacedResourceDomainService<TKubernetesObject, TKubernetesObjectList>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>, IMetadata<V1ObjectMeta>
    where TKubernetesObjectList : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
{
    Task<TKubernetesObject> GetResource(string resourceName, string namespaceName);
    Task<TKubernetesObjectList> GetResourceList(string namespaceName, int? pageLimit = null, string? continueToken = null);
    Task<IList<TKubernetesObject>> GetResources();
    Task<IList<TKubernetesObject>> GetResources(string namespaceName);
    Task<HttpOperationResponse<TKubernetesObjectList>> GetResourceWatchList(string namespaceName, string? lastResourceVersion = null, int? timeoutSeconds = null, CancellationToken cancellationToken = default);
}