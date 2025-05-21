using k8s;
using k8s.Autorest;
using k8s.Models;
using Microsoft.Extensions.Options;
using System.Net;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.Watchers;

public abstract class KubernetesWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>(
        TBackgroundQueue backgroundQueue,
        IOptions<WatchersOptions> options,
        IMetricsService metricsService,
        ILogger<KubernetesWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>> logger)
    : IKubernetesWatcher<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>, new()
    where TKubernetesObjectList : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
    where TKubernetesWatcherEvent : IWatcherEvent<TKubernetesObject>, new()
    where TBackgroundQueue : IKubernetesBackgroundQueue<TKubernetesObject>

{
    private static readonly Random random = new();
    protected readonly TBackgroundQueue BackgroundQueue = backgroundQueue;
    protected readonly double maxBackoffSeconds = 60;
    protected readonly int resourceListPageSize = 500;
    protected readonly Dictionary<string, TaskWithCts> Watchers = [];

    public Task Add(CancellationToken cancellationToken, string watcherKey = VarUtils.DefaultCacheRefreshKey)
    {
        if (Watchers.TryGetValue(watcherKey, out _))
        {
            logger.LogWarning(
                "Watcher for {kubernetesObjectType} and key {watcherKey} already existing. Ignoring Add req.",
                typeof(TKubernetesObject).Name,
                watcherKey);
            return Task.CompletedTask;
        }
        logger.LogInformation(
            "Adding Watcher for {kubernetesObjectType} and key {watcherKey}.",
            typeof(TKubernetesObject).Name,
            watcherKey);
        CancellationTokenSource cts = new();
        TaskWithCts watcherWithCts = new()
        {
            Task = CreateWatch(
                watcherKey,
                CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, cts.Token).Token),
            Cts = cts,
        };

        Watchers.Add(watcherKey, watcherWithCts);

        return Task.CompletedTask;
    }

    public async Task Delete(string watcherKey, CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Deleting Watcher for {kubernetesObjectType} and key {watcherKey}.",
            typeof(TKubernetesObject).Name,
            watcherKey);
        await EnqueueWatcherEvent(watcherKey, WatcherEventType.Flushed, new(), cancellationToken);
        if (Watchers.TryGetValue(watcherKey, out TaskWithCts taskWithCts))
        {
            taskWithCts.Cts.Cancel();
            // TODO: do I have to wait for Task.IsCanceled?
            Watchers.Remove(watcherKey);
        }
    }

    public async Task Recreate(CancellationToken cancellationToken, string watcherKey = VarUtils.DefaultCacheRefreshKey)
    {
        logger.LogWarning("Recreated called for {kubernetesObjectType} - {watcherKey}", typeof(TKubernetesObject).Name,
                        watcherKey);
        await Delete(watcherKey, cancellationToken);
        await Add(cancellationToken, watcherKey);
    }

    protected async Task CreateWatch(string watcherKey, CancellationToken cancellationToken)
    {
        bool isBenignError = false;
        string? lastResourceVersion = null;
        RetryDurationCalculator retryDurationCalculator = new(maxBackoffSeconds);
        int retryCount = -1; // -1 - first execution, 0 - no errors, 1, 2, 3 - retries

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                if (string.IsNullOrEmpty(lastResourceVersion))
                {
                    lastResourceVersion = await ProcessInitialResourcesAndGetLastResourceVersion(
                        watcherKey,
                        cancellationToken);
                    logger.LogInformation(
                        "Initial Resources Processed - {kubernetesObjectType} - {watcherKey} - {lastResourceVersion}",
                        typeof(TKubernetesObject).Name,
                        watcherKey,
                        lastResourceVersion);
                    await EnqueueWatcherEvent(watcherKey, WatcherEventType.Initialized, new(), cancellationToken);
                }

                do
                {
                    isBenignError = false;
                    Task<HttpOperationResponse<TKubernetesObjectList>> kubernetesObjectsResp =
                        GetKubernetesObjectWatchList(watcherKey, lastResourceVersion, cancellationToken);
                    await foreach ((WatchEventType type, TKubernetesObject item) in kubernetesObjectsResp.WatchAsync<TKubernetesObject, TKubernetesObjectList>(
                            ex =>
                            {
                                if (ex is KubernetesException && ex.Message.StartsWith("too old resource version"))
                                {
                                    logger.LogDebug(
                                        "{kubernetesObjectType} - {watcherKey} - lastResourceVersion set to null",
                                        typeof(TKubernetesObject).Name,
                                        watcherKey);
                                    lastResourceVersion = null;
                                }
                                else
                                {
                                    Console.WriteLine("mama");
                                    throw ex;
                                }
                            },
                            cancellationToken))
                    {
                        IncrementMetric(watcherKey, type);

                        if (type == WatchEventType.Bookmark)
                        {
                            lastResourceVersion = item.Metadata.ResourceVersion;
                            await EnqueueWatcherEvent(watcherKey, type.ToWatcherEvent(), item, cancellationToken);
                            logger.LogDebug(
                                "Bookmark Event - {kubernetesObjectType} - {watcherKey} - Resource Version - {resourceVersion}",
                                typeof(TKubernetesObject).Name,
                                watcherKey,
                                lastResourceVersion);
                        }
                        else
                        {
                            logger.LogInformation(
                                "Sending to Queue - {kubernetesObjectType} - {kubernetesWatchEvent} - {watcherKey} - {kubernetesObjectName} - {kubernetesObjectResourceVersion}",
                                typeof(TKubernetesObject).Name,
                                type.ToString(),
                                watcherKey,
                                item.Metadata.Name,
                                item.Metadata.ResourceVersion);
                            await EnqueueWatcherEvent(watcherKey, type.ToWatcherEvent(), item, cancellationToken);
                        }
                    }

                    logger.LogDebug(
                        "Watch stopped - {kubernetesObjectType} - {watcherKey} - status {watchStatus}",
                        typeof(TKubernetesObject).Name,
                        watcherKey,
                        kubernetesObjectsResp.Status);
                } while (!cancellationToken.IsCancellationRequested && !string.IsNullOrEmpty(lastResourceVersion));
            }
            catch (HttpRequestException ex) when (ex.InnerException is EndOfStreamException)
            {
                logger.LogDebug(
                    "Watcher {kubernetesObjectType} - {watcherKey} crashed - EndOfStreamException - {exceptionMessage}",
                    typeof(TKubernetesObject).Name,
                    watcherKey,
                    ex.Message);
                isBenignError = true;
            }
            //catch (HttpOperationException hoe) when (hoe.Response.StatusCode is HttpStatusCode.Unauthorized
            //                                             or HttpStatusCode.Forbidden or HttpStatusCode.NotFound)
            //{
            //    await EnqueueWatcherEvent(watcherKey, WatcherEventType.Error, new(), cancellationToken, hoe);
            //    // TODO: WatcherState
            //    await UpdateWatcherState(WatcherStateStatus.Red, watcherKey, hoe, cancellationToken);
            //}
            catch (OperationCanceledException)
            {
                isBenignError = true;
                // be free and be gone :-)
            }
            catch (Exception ex)
            {
                await EnqueueWatcherEvent(watcherKey, WatcherEventType.Error, new(), cancellationToken, ex);
                logger.LogError(
                    ex,
                    "Watcher {kubernetesObjectType} - {watcherKey} crashed - {exceptionMessage}",
                    typeof(TKubernetesObject).Name,
                    watcherKey,
                    ex.Message);

            }

            if (!isBenignError)
            {
                // TODO: check if "cache is stale" is a good ideea

                //bool enqueueErrorEventIsSuccessful = false;
                //while (!cancellationToken.IsCancellationRequested && !enqueueErrorEventIsSuccessful)
                //{
                //    // TODO: rehaul exception handling.
                //    // This is a temporary solution
                //    try
                //    {
                //        if (lastResourceVersion is not null)
                //        {
                //            logger.LogDebug(
                //                "Watcher {kubernetesObjectType} - {watcherKey} crashed - lastResourceVersion is not null - {lastResourceVersion}",
                //                typeof(TKubernetesObject).Name,
                //                watcherKey,
                //                lastResourceVersion);
                //            lastResourceVersion = null;
                //            // TODO: create (maybe) a dedicated exception for this
                //            await UpdateWatcherState(WatcherStateStatus.Yellow,
                //                watcherKey,
                //                new StaleWatcheCacheException("Watcher Cache is stale", watcherKey, typeof(TKubernetesObject)),
                //                cancellationToken);
                //        }
                //        else
                //        {
                //            logger.LogDebug(
                //                "Sending to Queue - {kubernetesObjectType} - EventWithError - {watcherKey}",
                //                typeof(TKubernetesObject).Name,
                //                watcherKey);

                //            await EnqueueWatcherEventWithError(watcherKey);
                //        }
                //        enqueueErrorEventIsSuccessful = true;
                //    }
                //    catch (Exception ex)
                //    {
                //        logger.LogError(
                //            ex,
                //            "Watcher for {kubernetesObjectType} and key {watcherKey} could not enqueue EventWithError - {exceptionMessage}",
                //            typeof(TKubernetesObject).Name,
                //            watcherKey,
                //            ex.Message);
                //        await Task.Delay(10000, cancellationToken);
                //        await UpdateWatcherState(WatcherStateStatus.Red, watcherKey, ex, cancellationToken);
                //    }
                //}

                TimeSpan waitTimeSpan = retryDurationCalculator.GetNextRetryDuration(++retryCount);

                logger.LogDebug(
                    "Watcher for {kubernetesObjectType} and key {watcherKey} is wating for {retryCount} (ss:ms)",
                    typeof(TKubernetesObject).Name,
                    watcherKey,
                    waitTimeSpan.ToString(@"ss\:fff"));
                await Task.Delay(waitTimeSpan, cancellationToken);
            }
        }
    }

    protected async Task<string> ProcessInitialResourcesAndGetLastResourceVersion(
        string watcherKey, CancellationToken cancellationToken)
    {
        string? continueToken = null;
        string? lastResourceVersion;

        do
        {
            TKubernetesObjectList customResourceList = await GetInitialResources(
                watcherKey, continueToken, cancellationToken);

            foreach (TKubernetesObject item in customResourceList.Items ?? [])
            {
                await EnqueueWatcherEvent(watcherKey, WatcherEventType.Added, item, cancellationToken);
            }

            continueToken = customResourceList.Metadata.ContinueProperty;
            lastResourceVersion = customResourceList.Metadata.ResourceVersion;
        } while (!string.IsNullOrEmpty(continueToken) && !cancellationToken.IsCancellationRequested);

        return lastResourceVersion;
    }

    protected abstract Task<TKubernetesObjectList> GetInitialResources(
        string watcherKey, string? continueToken, CancellationToken? cancellationToken = null);

    protected abstract Task<HttpOperationResponse<TKubernetesObjectList>> GetKubernetesObjectWatchList(
        string watcherKey, string? lastResourceVersion, CancellationToken? cancellationToken = null);

    protected virtual void ProcessReceivedKubernetesObject(TKubernetesObject kubernetesObject)
    { }

    protected int GetWatcherRandomTimeout()
        => random.Next(options.Value.WatchTimeoutInSeconds, (int)(options.Value.WatchTimeoutInSeconds * 1.1));

    //protected async Task UpdateWatcherState(WatcherStateStatus watcherStateStatus, string watcherKey, CancellationToken cancellationToken)
    //    => await UpdateWatcherState(watcherStateStatus, watcherKey, null, cancellationToken);
    protected async Task UpdateWatcherState(WatcherStateStatus watcherStateStatus, string watcherKey, Exception? exception, CancellationToken cancellationToken)
    {
        WatcherStateInfo watcherStateInfo = new()
        {
            WatchedKubernetesObjectType = typeof(TKubernetesObject),
            WatcherKey = watcherKey,
            Status = watcherStateStatus,
            LastException = exception,
        };

        bool enqueueEventIsSuccessful = false;
        while (!cancellationToken.IsCancellationRequested && !enqueueEventIsSuccessful)
        {
            try
            {
                logger.LogDebug(
                    "Sending to Queue - {kubernetesObjectType} - WatchState - {watcherKey}",
                    typeof(TKubernetesObject).Name,
                    watcherKey);

//                await backgroundQueueWatcherState.QueueBackgroundWorkItemAsync(watcherStateInfo, cancellationToken);
                enqueueEventIsSuccessful = true;
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Watcher for {kubernetesObjectType} and key {watcherKey} could not enqueue WatchStateInfo - {exceptionMessage}",
                    typeof(TKubernetesObject).Name,
                    watcherKey,
                    ex.Message);
                await Task.Delay(10000, cancellationToken);
            }
        }
    }

    protected void IncrementMetric(string watcherKey, WatchEventType watchEventType, int value = 1)
    {
        metricsService.WatcherProcessedMessagesCounter.Add(value,
            new KeyValuePair<string, object?>("resource_kind", typeof(TKubernetesObject).Name),
            new KeyValuePair<string, object?>("resource_level", watcherKey == VarUtils.DefaultCacheRefreshKey ? "cluster_scoped" : "namespaced"),
            new KeyValuePair<string, object?>("namespace_name", watcherKey == VarUtils.DefaultCacheRefreshKey ? null : watcherKey),
            new KeyValuePair<string, object?>("watch_event_type", watchEventType.ToString())
        );
    }

    protected async Task EnqueueWatcherEvent(
        string watcherKey, WatcherEventType watchEventType, TKubernetesObject kubernetesObject,
        CancellationToken cancellationToken, Exception? exception = null)
    {
        logger.LogDebug(
            "Sending to Queue - {kubernetesObjectType} - {kubernetesWatchEvent} - {watcherKey} - {kubernetesObjectName}",
            typeof(TKubernetesObject).Name,
            watchEventType.ToString(),
            watcherKey,
            kubernetesObject.Metadata?.Name ?? "N/A");
        try
        {
            ProcessReceivedKubernetesObject(kubernetesObject);
            TKubernetesWatcherEvent kubernetesWatcherEvent =
                new()
                {
                    KubernetesObject = kubernetesObject,
                    WatcherEventType = watchEventType,
                    WatcherKey = watcherKey,
                    Exception = exception,
                };
            await BackgroundQueue.QueueBackgroundWorkItemAsync(kubernetesWatcherEvent, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Watcher for {kubernetesObjectType} and key {watcherKey} could not enqueue {kubernetesWatchEvent} - {exceptionMessage}",
                typeof(TKubernetesObject).Name,
                watcherKey,
                watchEventType.ToString(),
                ex.Message);
        }
    }
}
