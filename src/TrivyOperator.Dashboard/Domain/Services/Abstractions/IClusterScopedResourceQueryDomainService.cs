using k8s;
using k8s.Models;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;
public interface IClusterScopedResourceQueryDomainService<TKubernetesObject, TKubernetesObjectList>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>, IMetadata<V1ObjectMeta>
    where TKubernetesObjectList : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
{
    Task<TKubernetesObject> GetResource(string resourceName);
    Task<TKubernetesObjectList> GetResourceList(int? pageLimit = null, string? continueToken = null);
    Task<IList<TKubernetesObject>> GetResources();
}