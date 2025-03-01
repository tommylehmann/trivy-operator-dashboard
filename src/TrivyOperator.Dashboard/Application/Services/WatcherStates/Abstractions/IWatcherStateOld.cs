using k8s.Autorest;

namespace TrivyOperator.Dashboard.Application.Services.WatcherStates.Abstractions;

public interface IWatcherStateOld
{
    Task ProcessWatcherError(Type watchedKubernetesObjectType, string watcherKey, HttpOperationException exception);
    ValueTask ProcessWatcherSuccess(Type watchedKubernetesObjectType, string watcherKey);
    ValueTask ProcessWatcherCancel(Type watchedKubernetesObjectType, string watcherKey);
}
