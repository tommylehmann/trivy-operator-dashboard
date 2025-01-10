using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;

public abstract class KubernetesResourceDomainService<TKubernetesObject>(
    IKubernetesClientFactory kubernetesClientFactory)
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>, IMetadata<V1ObjectMeta>
{
    private readonly Kubernetes kubernetesClient = kubernetesClientFactory.GetClient();
    protected IKubernetesClientFactory kubernetesClientFactory = kubernetesClientFactory;
    public abstract Task<IList<TKubernetesObject>> GetResources();
}
