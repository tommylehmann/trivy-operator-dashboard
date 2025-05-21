using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventCoordinators.Abstractions;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.KubernetesEventCoordinators;

public class
    ClusterScopedKubernetesEventCoordinator<TKubernetesEventDispatcher, TKubernetesWatcher, TKubernetesObject>(
        TKubernetesEventDispatcher kubernetesEventDispatcher,
        TKubernetesWatcher kubernetesWatcher,
        ILogger<ClusterScopedKubernetesEventCoordinator<TKubernetesEventDispatcher, TKubernetesWatcher, TKubernetesObject>> logger)
    : KubernetesEventCoordinator<TKubernetesEventDispatcher, TKubernetesWatcher,
            TKubernetesObject>(kubernetesEventDispatcher, kubernetesWatcher, logger),
        IClusterScopedKubernetesEventCoordinator 
    where TKubernetesEventDispatcher : IKubernetesEventDispatcher<TKubernetesObject>
    where TKubernetesWatcher : IClusterScopedWatcher<TKubernetesObject>
    where TKubernetesObject : class, IKubernetesObject<V1ObjectMeta>;
