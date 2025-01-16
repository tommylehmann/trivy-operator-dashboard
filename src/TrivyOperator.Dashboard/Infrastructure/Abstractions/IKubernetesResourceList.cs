using k8s;
using k8s.Models;

namespace TrivyOperator.Dashboard.Infrastructure.Abstractions;

public interface IKubernetesResourceList<TKubernetesObject> : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
{
}
