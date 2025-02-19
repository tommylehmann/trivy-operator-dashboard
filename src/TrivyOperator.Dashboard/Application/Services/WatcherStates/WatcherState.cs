using TrivyOperator.Dashboard.Application.Services.Alerts;
using TrivyOperator.Dashboard.Application.Services.Alerts.Abstractions;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.WatcherStates;


// TODO: unify WathcerState and CacheRefresh with a base class
public class WatcherState(
    IBackgroundQueue<WatcherStateInfo> backgroundQueue,
    IConcurrentCache<string, WatcherStateInfo> cache,
    IAlertsService alertService,
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
            try
            {
                WatcherStateInfo? watcherStateInfo = await backgroundQueue.DequeueAsync(cancellationToken);
                switch(watcherStateInfo?.Status)
                {
                    case WatcherStateStatus.Red:
                    case WatcherStateStatus.Yellow:
                    case WatcherStateStatus.Green:
                    case WatcherStateStatus.Unknown:
                        await ProcessAddEvent(watcherStateInfo, cancellationToken);
                        break;
                    case WatcherStateStatus.Deleted:
                        await ProcessDeleteEvent(watcherStateInfo);
                        break;
                }
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Error processing event for Watcher State.");
            }
            await Task.Delay(10000, cancellationToken);
        }
    }

    private async Task ProcessAddEvent(WatcherStateInfo watcherStateInfo, CancellationToken cancellationToken)
    {
        string cacheKey = GetCacheKey(watcherStateInfo);
        cache[cacheKey] = watcherStateInfo;

        await SetAlert(watcherStateInfo, cancellationToken);
    }

    private ValueTask ProcessDeleteEvent(WatcherStateInfo watcherStateInfo)
    {
        cache.TryRemove(GetCacheKey(watcherStateInfo), out _);
        logger.LogInformation(
            "Removed WatcherState for {kubernetesObjectType} and key {watcherKey}.",
            watcherStateInfo.WatchedKubernetesObjectType.Name,
            watcherStateInfo.WatcherKey);
        return ValueTask.CompletedTask;
    }

    private async Task SetAlert(WatcherStateInfo watcherStateInfo, CancellationToken cancellationToken)
    {
        if (watcherStateInfo.LastException != null)
        {
            string namespaceName = watcherStateInfo.WatcherKey == VarUtils.DefaultCacheRefreshKey ? "n/a" : watcherStateInfo.WatcherKey;
            await alertService.AddAlert(
                alertEmitter,
                new Alert
                {
                    EmitterKey = GetCacheKey(watcherStateInfo),
                    Message =
                        $"Watcher for {watcherStateInfo.WatchedKubernetesObjectType.Name} and Namespace {namespaceName} failed.",
                    Severity = Severity.Error,
                });
        }
        else
        {
            await alertService.RemoveAlert(
                alertEmitter,
                new Alert
                {
                    EmitterKey = GetCacheKey(watcherStateInfo),
                    Message = string.Empty,
                    Severity = Severity.Info,
                });
        }
    }

    private readonly string alertEmitter = "Watcher";
    private static string GetCacheKey(WatcherStateInfo watcherStateInfo) =>
        $"{watcherStateInfo.WatchedKubernetesObjectType.Name}|{watcherStateInfo.WatcherKey}";
}
