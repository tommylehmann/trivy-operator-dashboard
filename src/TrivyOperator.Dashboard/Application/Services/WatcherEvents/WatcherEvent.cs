using k8s;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.WatcherEvents;

public class WatcherEvent<TKubernetesObject> : IWatcherEvent<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject, new()
{
    public WatcherEventType WatcherEventType { get; init; }
    public TKubernetesObject KubernetesObject { get; init; } = new();
    public string WatcherKey { get; init; } = string.Empty;
    public Exception? Exception { get; init; } = null;
}
