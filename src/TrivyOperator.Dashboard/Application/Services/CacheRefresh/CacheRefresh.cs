using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.CacheRefresh.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.CacheRefresh;

public class CacheRefresh<TKubernetesObject, TBackgroundQueue>(
    TBackgroundQueue backgroundQueue,
    IListConcurrentCache<TKubernetesObject> cache,
    ILogger<CacheRefresh<TKubernetesObject, TBackgroundQueue>> logger)
    : ICacheRefresh<TKubernetesObject, TBackgroundQueue>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
    where TBackgroundQueue : IKubernetesBackgroundQueue<TKubernetesObject>
{
    protected Task? CacheRefreshTask;
    protected IListConcurrentCache<TKubernetesObject> cache = cache;

    public void StartEventsProcessing(CancellationToken cancellationToken)
    {
        if (IsQueueProcessingStarted())
        {
            logger.LogWarning(
                "Processing for {kubernetesObjectType} already started. Ignoring...",
                typeof(TKubernetesObject).Name);
            return;
        }

        logger.LogInformation("CacheRefresh for {kubernetesObjectType} is starting.", typeof(TKubernetesObject).Name);
        CacheRefreshTask = ProcessChannelMessages(cancellationToken);
    }

    public bool IsQueueProcessingStarted() => CacheRefreshTask is not null; // TODO: check for other task states

    protected virtual async Task ProcessChannelMessages(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                IWatcherEvent<TKubernetesObject>? watcherEvent = await backgroundQueue.DequeueAsync(cancellationToken);
                switch (watcherEvent?.WatcherEventType)
                {
                    case WatcherEventType.Added:
                        ProcessAddEvent(watcherEvent, cancellationToken);
                        break;
                    case WatcherEventType.Deleted:
                        await ProcessDeleteEvent(watcherEvent, cancellationToken);
                        break;
                    case WatcherEventType.Error:
                        ProcessErrorEvent(watcherEvent);
                        break;
                    case WatcherEventType.Modified:
                        ProcessModifiedEvent(watcherEvent, cancellationToken);
                        break;
                    case WatcherEventType.Init:
                        await ProcessBookmarkEvent(watcherEvent, cancellationToken);
                        break;
                    case WatcherEventType.Unknown:
                        logger.LogWarning(
                            "Unknown event type {eventType} for {kubernetesObjectType}.",
                            watcherEvent.WatcherEventType,
                            typeof(TKubernetesObject).Name);
                        break;
                    default:
                        break;
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

    protected virtual void ProcessAddEvent(
        IWatcherEvent<TKubernetesObject> watcherEvent,
        CancellationToken cancellationToken)
    {
        string watcherKey = VarUtils.GetCacheRefreshKey(watcherEvent.KubernetesObject);

        logger.LogDebug(
            "ProcessAddEvent - {kubernetesObjectType} - {watcherKey} - {kubernetesObjectName}",
            typeof(TKubernetesObject).Name,
            watcherKey,
            watcherEvent.KubernetesObject.Metadata.Name);

        if (cache.TryGetValue(watcherKey, out IList<TKubernetesObject>? kubernetesObjects))
        {
            IList<TKubernetesObject> existingKubernetesObjects =
                kubernetesObjects.Where(x => x.Name() == watcherEvent.KubernetesObject.Name()).ToList() ?? [];
            foreach (TKubernetesObject existingKubernetesObject in existingKubernetesObjects)
            {
                kubernetesObjects.Remove(existingKubernetesObject);
            }

            kubernetesObjects.Add(watcherEvent.KubernetesObject);
        }
        else // first time, the cache is really empty
        {
            cache.TryAdd(watcherKey, [watcherEvent.KubernetesObject]);
        }
    }

    protected virtual Task ProcessDeleteEvent(IWatcherEvent<TKubernetesObject> watcherEvent, CancellationToken cancellationToken)
    {
        string watcherKey = VarUtils.GetCacheRefreshKey(watcherEvent.KubernetesObject);

        logger.LogDebug(
            "ProcessDeleteEvent - {kubernetesObjectType} - {watcherKey} - {kubernetesObjectName}",
            typeof(TKubernetesObject).Name,
            watcherKey,
            watcherEvent.KubernetesObject.Metadata.Name);

        if (cache.TryGetValue(watcherKey, out IList<TKubernetesObject>? kubernetesObjects))
        {
            IList<TKubernetesObject> existingKubernetesObjects =
                kubernetesObjects.Where(x => x.Name() == watcherEvent.KubernetesObject.Name()).ToList() ?? [];
            foreach (TKubernetesObject existingKubernetesObject in existingKubernetesObjects)
            {
                kubernetesObjects.Remove(existingKubernetesObject);
            }
        }
        return Task.CompletedTask;
    }

    protected virtual void ProcessErrorEvent(IWatcherEvent<TKubernetesObject> watcherEvent)
    {
        string watcherKey = VarUtils.GetCacheRefreshKey(watcherEvent.KubernetesObject);
        logger.LogDebug(
            "ProcessErrorEvent - {kubernetesObjectType} - {watcherKey}",
            typeof(TKubernetesObject).Name,
            watcherKey);
        cache.TryRemove(watcherKey, out _);
    }

    protected virtual void ProcessModifiedEvent(
        IWatcherEvent<TKubernetesObject> watcherEvent,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("ProcessModifiedEvent - redirecting to ProcessAddEvent.");
        ProcessAddEvent(watcherEvent, cancellationToken);
    }

    protected virtual Task ProcessBookmarkEvent(IWatcherEvent<TKubernetesObject> watcherEvent, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
