using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.Alerts;
using TrivyOperator.Dashboard.Application.Services.Alerts.Abstractions;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.WatcherStates;

public class WatcherState<TKubernetesObject>(
    IConcurrentCache<string, WatcherStateInfo> cache,
    IAlertsService alertService,
    ILogger<WatcherState<TKubernetesObject>> logger) 
    : IKubernetesEventProcessor<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
{
    public async Task ProcessKubernetesEvent(IWatcherEvent<TKubernetesObject> watcherEvent, CancellationToken cancellationToken)
    {
        WatcherStateInfo watcherStateInfo = new()
        {
            WatchedKubernetesObjectType = typeof(TKubernetesObject),
            WatcherKey = watcherEvent.WatcherKey,
            Status = WatcherStateStatus.Green,
            LastException = watcherEvent.Exception,
        };

        await ProcessChannelMessages(watcherStateInfo, cancellationToken);
    }

    protected async Task ProcessChannelMessages(WatcherStateInfo watcherStateInfo, CancellationToken cancellationToken)
    {
        logger.LogDebug(
            "Sending to Queue - {kubernetesObjectType} - WatchState - {watcherKey}",
            watcherStateInfo?.WatchedKubernetesObjectType.Name,
            watcherStateInfo?.WatcherKey);
        switch (watcherStateInfo?.Status)
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

    private async Task ProcessAddEvent(WatcherStateInfo watcherStateInfo, CancellationToken cancellationToken)
    {
        string cacheKey = GetCacheKey(watcherStateInfo);
        cache[cacheKey] = watcherStateInfo;
        logger.LogDebug("Processing event for {cacherKey} with state {watcherStateStatus}",
            cacheKey,
            watcherStateInfo.Status);

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
                    Severity = watcherStateInfo.Status == WatcherStateStatus.Red ? Severity.Error : Severity.Warning,
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
