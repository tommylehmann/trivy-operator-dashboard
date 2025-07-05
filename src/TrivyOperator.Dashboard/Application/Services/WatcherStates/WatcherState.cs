using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.KubernetesEventDispatchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.WatcherStates;

public class WatcherState<TKubernetesObject>(
    IConcurrentCache<string, WatcherStateInfo> cache,
    ILogger<WatcherState<TKubernetesObject>> logger) 
    : IKubernetesEventProcessor<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
{
    public Task ProcessKubernetesEvent(IWatcherEvent<TKubernetesObject> watcherEvent, CancellationToken cancellationToken)
    {
        if (watcherEvent.IsStatic)
        {
            return Task.CompletedTask;
        }
        switch (watcherEvent.WatcherEventType)
        {
            case WatcherEventType.Added:
            case WatcherEventType.Deleted:
            case WatcherEventType.Modified:
            case WatcherEventType.Bookmark:
            case WatcherEventType.WatcherConnected:
                ProcessGreenEvent(watcherEvent);
                break;
            case WatcherEventType.Flushed:
                ProcessDeleteEvent(watcherEvent);
                break;
            case WatcherEventType.Error:
                ProcessRedEvent(watcherEvent);
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

        return Task.CompletedTask;
    }

    private void ProcessGreenEvent(IWatcherEvent<TKubernetesObject> watcherEvent)
    {
        WatcherStateInfo watcherStateInfo = new()
        {
            WatcherKey = watcherEvent.WatcherKey,
            WatchedKubernetesObjectType = typeof(TKubernetesObject),
            LastException = null,
            LastEventMoment = DateTime.UtcNow,
            Status = WatcherStateStatus.Green,
        };
        
        cache[GetCacheKey(watcherEvent)] = watcherStateInfo;
    }

    private void ProcessRedEvent(IWatcherEvent<TKubernetesObject> watcherEvent)
    {
        WatcherStateInfo watcherStateInfo = new()
        {
            WatcherKey = watcherEvent.WatcherKey,
            WatchedKubernetesObjectType = typeof(TKubernetesObject),
            LastException = watcherEvent.Exception,
            LastEventMoment = DateTime.UtcNow,
            Status = WatcherStateStatus.Red,
        };
        
        cache[GetCacheKey(watcherEvent)] = watcherStateInfo;
    }

    private void ProcessDeleteEvent(IWatcherEvent<TKubernetesObject> watcherEvent)
    {
        cache.TryRemove(GetCacheKey(watcherEvent), out _);
    }
    
    private static string GetCacheKey(IWatcherEvent<TKubernetesObject> watcherEvent) =>
        $"{typeof(TKubernetesObject).Name}|{watcherEvent.WatcherKey}";
}
