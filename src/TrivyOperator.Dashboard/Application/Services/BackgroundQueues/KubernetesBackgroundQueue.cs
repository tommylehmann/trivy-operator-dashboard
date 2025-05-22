using k8s;
using k8s.Models;
using Microsoft.Extensions.Options;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.BackgroundQueues;

public class KubernetesBackgroundQueue<TKubernetesObject>(IOptions<BackgroundQueueOptions> options,
    ILogger<KubernetesBackgroundQueue<TKubernetesObject>> localLogger)
    : BackgroundQueue<IWatcherEvent<TKubernetesObject>>(options, localLogger),
      IKubernetesBackgroundQueue<TKubernetesObject>
        where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
{
    protected override void LogQueue(IWatcherEvent<TKubernetesObject> enqueuedObject)
    {
        localLogger.LogDebug(
            "Queueing Event {watcherEventType} - {kubernetesObjectType} - {kubernetesObjectName}",
            enqueuedObject.WatcherEventType,
            typeof(TKubernetesObject).Name,
            enqueuedObject.KubernetesObject?.Metadata?.Name);
    }
    protected override void LogDequeue(IWatcherEvent<TKubernetesObject> dequeuedObject)
    {
        logger.LogDebug(
            "Queueing Event {watcherEventType} - {kubernetesObjectType} - {kubernetesObjectName}",
            dequeuedObject.WatcherEventType,
            typeof(TKubernetesObject).Name,
            dequeuedObject.KubernetesObject?.Metadata?.Name);
    }
}
