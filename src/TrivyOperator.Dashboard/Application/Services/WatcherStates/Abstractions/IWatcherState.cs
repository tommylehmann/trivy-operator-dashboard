namespace TrivyOperator.Dashboard.Application.Services.WatcherStates.Abstractions;

public interface IWatcherState
{
    bool IsQueueProcessingStarted();
    void StartEventsProcessing(CancellationToken cancellationToken);
}