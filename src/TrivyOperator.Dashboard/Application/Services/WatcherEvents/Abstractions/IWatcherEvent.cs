using k8s;

namespace TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;

public interface IWatcherEvent<TKubernetesObject> where TKubernetesObject : IKubernetesObject
{
    WatcherEventType WatcherEventType { get; init; }
    TKubernetesObject KubernetesObject { get; init; }
}
