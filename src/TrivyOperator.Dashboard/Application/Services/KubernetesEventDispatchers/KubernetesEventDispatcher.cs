using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers;

public class KubernetesEventDispatcher<TKubernetesObject, TBackgroundQueue>(
    IEnumerable<IKubernetesEventProcessor<TKubernetesObject>> services,
    TBackgroundQueue backgroundQueue,
    ILogger<KubernetesEventDispatcher<TKubernetesObject, TBackgroundQueue>> logger) : IKubernetesEventDispatcher<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
    where TBackgroundQueue : IKubernetesBackgroundQueue<TKubernetesObject>
{
    protected Task? dispatcherQueueProcessor;
    protected bool isQueueProcessingStarted => !dispatcherQueueProcessor?.IsCanceled ?? false;

    public void StartEventsProcessing(CancellationToken cancellationToken)
    {
        if (isQueueProcessingStarted)
        {
            logger.LogWarning(
                "Kubernetes Event Dispatcher for {kubernetesObjectType} already started. Ignoring...",
                typeof(TKubernetesObject).Name);
            return;
        }
        logger.LogInformation("KubernetesEventDispatcher for {kubernetesObjectType} is starting.", typeof(TKubernetesObject).Name);
        dispatcherQueueProcessor = ProcessChannelMessages(cancellationToken);
    }

    protected virtual async Task ProcessChannelMessages(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                IWatcherEvent<TKubernetesObject>? watcherEvent = await backgroundQueue.DequeueAsync(cancellationToken);

                if (watcherEvent is null)
                {
                    logger.LogWarning("Received null watcher event. Ignoring...");
                    continue;
                }
                try
                {
                    IEnumerable<Task> tasks = services.Select(service => service.ProcessKubernetesEvent(watcherEvent, cancellationToken));
                    await Task.WhenAll(tasks);
                }
                catch (AggregateException aggEx)
                {
                    foreach (Exception ex in aggEx.InnerExceptions)
                    {
                        logger.LogError(ex,
                            "An error occurred while processing the watcher event for {kubernetesObjectType}. Message: {exceptionMessage}",
                            typeof(TKubernetesObject).Name,
                            ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Error processing event for {kubernetesObjectType}.",
                    typeof(TKubernetesObject).Name);
            }
        }
    }
}
