using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers;

public class
    ClusterScopedCacheWatcherEventHandler<TKubernetesEventDispatcher, TKubernetesWatcher, TKubernetesObject>(
        TKubernetesEventDispatcher kubernetesEventDispatcher,
        TKubernetesWatcher kubernetesWatcher,
        ILogger<ClusterScopedCacheWatcherEventHandler<TKubernetesEventDispatcher, TKubernetesWatcher, TKubernetesObject>> logger)
    : CacheWatcherEventHandler<TKubernetesEventDispatcher, TKubernetesWatcher,
            TKubernetesObject>(kubernetesEventDispatcher, kubernetesWatcher, logger),
        IClusterScopedCacheWatcherEventHandler 
    where TKubernetesEventDispatcher : IKubernetesEventDispatcher<TKubernetesObject>
    where TKubernetesWatcher : IClusterScopedWatcher<TKubernetesObject>
    where TKubernetesObject : class, IKubernetesObject<V1ObjectMeta>;
