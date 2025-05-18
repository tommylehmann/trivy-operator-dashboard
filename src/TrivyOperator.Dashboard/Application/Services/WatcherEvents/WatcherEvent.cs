using k8s;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.WatcherEvents;

public class WatcherEvent<TKubernetesObject> : IWatcherEvent<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject
{
    public WatcherEventType WatcherEventType { get; init; }
    public TKubernetesObject KubernetesObject { get; init; } = default!;
}
