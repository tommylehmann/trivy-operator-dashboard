using k8s.Models;
using k8s;

namespace TrivyOperator.Dashboard.Infrastructure.Abstractions;

public interface IKubernetesResourceList<TKubernetesObject> : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
{
}
