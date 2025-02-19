using k8s;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.WatcherStates;

public class WatcherState(
    //IBackgroundQueue<WatcherStateInfo> backgroundQueue,
    IConcurrentCache<string, WatcherStateInfo> cache,
    ILogger<WatcherState> logger)
{
    protected Task? WatcherStateTask;

    public void StartEventsProcessing(CancellationToken cancellationToken)
    {
        if (IsQueueProcessingStarted())
        {
            logger.LogWarning("Processing for WatcherStates already started. Ignoring...");
            return;
        }

        logger.LogInformation("WatcherState is starting.");
        WatcherStateTask = ProcessChannelMessages(cancellationToken);
    }

    public bool IsQueueProcessingStarted() => WatcherStateTask is not null; // TODO: check for other task states

    protected async Task ProcessChannelMessages(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            //try
            //{
            //    WatcherStateInfo watcherStateInfo = await backgroundQueue.DequeueAsync(cancellationToken);
            //}
            //catch (Exception ex)
            //{
            //    logger.LogError(
            //        ex,
            //        "Error processing event for Watcher State.");
            //}
            await Task.Delay(10000, cancellationToken);
        }
    }
}
