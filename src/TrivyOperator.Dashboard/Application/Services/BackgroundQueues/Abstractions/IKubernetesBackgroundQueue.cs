using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;

public interface IKubernetesBackgroundQueue<TKubernetesObject> : IBackgroundQueue<IWatcherEvent<TKubernetesObject>>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>;
