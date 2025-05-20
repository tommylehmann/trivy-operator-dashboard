using k8s;
using k8s.Models;

namespace TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers.Abstractions;

public interface IKubernetesEventDispatcher<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
{
    void StartEventsProcessing(CancellationToken cancellationToken);
}