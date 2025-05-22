using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.Alerts;
using TrivyOperator.Dashboard.Application.Services.Alerts.Abstractions;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.WatcherStateAlertRefreshers;

public class WatcherStateAlertRefresh<TKubernetesObject>(
    IAlertsService alertService,
    ILogger<WatcherStateAlertRefresh<TKubernetesObject>> logger)
    : IKubernetesEventProcessor<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
{
    public async Task ProcessKubernetesEvent(IWatcherEvent<TKubernetesObject> watcherEvent, CancellationToken cancellationToken)
    {
        switch (watcherEvent.WatcherEventType)
        {
            case WatcherEventType.Added:
            case WatcherEventType.Deleted:
            case WatcherEventType.Modified:
            case WatcherEventType.Bookmark:
            case WatcherEventType.Flushed:
                await RemoveAlert(watcherEvent, cancellationToken);
                break;
            case WatcherEventType.Error:
                await AddAlert(watcherEvent, cancellationToken);
                break;
            case WatcherEventType.Initialized:
                break;
            case WatcherEventType.Unknown:
                logger.LogWarning("{watcherEventType} event type {eventType} for {kubernetesObjectType}.",
                    watcherEvent.WatcherEventType.ToString(), watcherEvent.WatcherEventType, typeof(TKubernetesObject).Name);
                break;
            default:
                break;
        }
    }

    private async ValueTask AddAlert(IWatcherEvent<TKubernetesObject> watcherEvent, CancellationToken cancellationToken)
    {
        if (activeAlerts.Contains(watcherEvent.WatcherKey))
        {
            return;
        }

        activeAlerts.Add(watcherEvent.WatcherKey);

        string namespaceName = watcherEvent.WatcherKey == VarUtils.DefaultCacheRefreshKey ? "n/a" : watcherEvent.WatcherKey;
        await alertService.AddAlert(
            alertEmitter,
            new Alert
            {
                EmitterKey = GetCacheKey(watcherEvent),
                Message = $"Watcher for {typeof(TKubernetesObject).Name} and Namespace {namespaceName} failed.",
                Severity = Severity.Error,
            }, cancellationToken);
    }

    private async ValueTask RemoveAlert(IWatcherEvent<TKubernetesObject> watcherEvent, CancellationToken cancellationToken)
    {
        if (activeAlerts.Contains(watcherEvent.WatcherKey))
        {
            activeAlerts.Remove(watcherEvent.WatcherKey);

            await alertService.RemoveAlert(
            alertEmitter,
            new Alert
            {
                EmitterKey = GetCacheKey(watcherEvent),
                Message = string.Empty,
                Severity = Severity.Info,
            },
            cancellationToken);
        }
    }

    private static readonly string alertEmitter = "Watcher";
    private static string GetCacheKey(IWatcherEvent<TKubernetesObject> watcherEvent) =>
        $"{typeof(TKubernetesObject).Name}|{watcherEvent.WatcherKey}";
    private static readonly HashSet<string> activeAlerts = [];
}
